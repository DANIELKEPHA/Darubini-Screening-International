"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Environment variable validation
const REFERENCE_LATITUDE = parseFloat(process.env.JOB_SITE_LAT || "");
const REFERENCE_LONGITUDE = parseFloat(process.env.JOB_SITE_LNG || "");
const GEOFENCE_RADIUS_METERS = parseFloat(process.env.GEOFENCE_RADIUS || "");
if (isNaN(REFERENCE_LATITUDE) || REFERENCE_LATITUDE < -90 || REFERENCE_LATITUDE > 90) {
    console.error("Invalid JOB_SITE_LAT in environment variables");
    throw new Error("Invalid JOB_SITE_LAT in environment variables");
}
if (isNaN(REFERENCE_LONGITUDE) || REFERENCE_LONGITUDE < -180 || REFERENCE_LONGITUDE > 180) {
    console.error("Invalid JOB_SITE_LNG in environment variables");
    throw new Error("Invalid JOB_SITE_LNG in environment variables");
}
if (isNaN(GEOFENCE_RADIUS_METERS) || GEOFENCE_RADIUS_METERS <= 0) {
    console.error("Invalid GEOFENCE_RADIUS in environment variables");
    throw new Error("Invalid GEOFENCE_RADIUS in environment variables");
}
const actorFieldMap = {
    admin: "actorAdminCognitoId",
    accounts: "actorAccountsCognitoId",
    staff: "actorStaffCognitoId",
};
const createAuditLog = (action_1, entityId_1, role_1, cognitoId_1, attendance_1, ...args_1) => __awaiter(void 0, [action_1, entityId_1, role_1, cognitoId_1, attendance_1, ...args_1], void 0, function* (action, entityId, role, cognitoId, attendance, extraMeta = {}) {
    var _a, _b;
    try {
        yield prisma.auditLog.create({
            data: {
                action,
                entity: "Attendance",
                entityId,
                meta: Object.assign({ employeeCognitoId: attendance.adminCognitoId ||
                        attendance.accountsCognitoId ||
                        attendance.staffCognitoId, checkInTime: (_a = attendance.checkInTime) === null || _a === void 0 ? void 0 : _a.toISOString(), checkOutTime: (_b = attendance.checkOutTime) === null || _b === void 0 ? void 0 : _b.toISOString(), totalHours: attendance.totalHours, status: attendance.status, breakType: attendance.breakType, autoCheckedOut: attendance.autoCheckedOut, role,
                    cognitoId }, extraMeta),
                [actorFieldMap[role]]: cognitoId,
            },
        });
    }
    catch (auditError) {
        console.warn(`Failed to create audit log for ${action}:`, auditError);
    }
});
const autoCheckout = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Find all open sessions (CHECKED_IN with no checkOutTime)
        const openSessions = yield prisma.attendance.findMany({
            where: {
                status: client_1.AttendanceStatus.CHECKED_IN,
                checkOutTime: null,
            },
        });
        let processed = 0;
        for (const session of openSessions) {
            if (!session.checkInTime) {
                console.warn(`Skipping invalid attendance record: checkInTime is null for ID ${session.id}`);
                continue;
            }
            // Set auto-checkout time to 10:00 PM EAT of the check-in day
            const autoCheckOutTime = new Date(session.checkInTime);
            autoCheckOutTime.setHours(22, 0, 0, 0); // 10:00 PM EAT
            if (autoCheckOutTime < session.checkInTime) {
                autoCheckOutTime.setDate(autoCheckOutTime.getDate() + 1); // Next day if check-in was after 22:00
            }
            const totalHours = (autoCheckOutTime.getTime() - session.checkInTime.getTime()) / (1000 * 60 * 60);
            yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
                const updatedAttendance = yield tx.attendance.update({
                    where: { id: session.id },
                    data: {
                        checkOutTime: autoCheckOutTime,
                        checkOutLat: session.checkInLat,
                        checkOutLng: session.checkInLng,
                        totalHours,
                        status: client_1.AttendanceStatus.CHECKED_OUT,
                        autoCheckedOut: true,
                    },
                });
                const role = updatedAttendance.adminCognitoId
                    ? "admin"
                    : updatedAttendance.accountsCognitoId
                        ? "accounts"
                        : "staff";
                const cognitoId = updatedAttendance.adminCognitoId ||
                    updatedAttendance.accountsCognitoId ||
                    updatedAttendance.staffCognitoId ||
                    "system";
                yield createAuditLog("AUTO_CHECK_OUT", updatedAttendance.id.toString(), role, cognitoId, updatedAttendance, {
                    reason: "Scheduled auto-checkout at 10:00 PM EAT",
                    autoCheckOutTime: autoCheckOutTime.toISOString(),
                });
                processed++;
            }));
        }
        return { status: "success", processed };
    }
    catch (error) {
        console.error("Error in auto-checkout job:", {
            message: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString(),
        });
        throw error;
    }
    finally {
        yield prisma.$disconnect();
    }
});
// Run immediately
autoCheckout()
    .then((result) => {
    process.exit(0);
})
    .catch((err) => {
    console.error("Auto-checkout failed:", err);
    process.exit(1);
});
