import { PrismaClient, Prisma, AttendanceStatus, BreakType } from "@prisma/client";

const prisma = new PrismaClient();

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

type UserRole = "admin" | "accounts" | "staff";

const actorFieldMap: Record<UserRole, string> = {
    admin: "actorAdminCognitoId",
    accounts: "actorAccountsCognitoId",
    staff: "actorStaffCognitoId",
};

const createAuditLog = async (
    action: string,
    entityId: string,
    role: UserRole,
    cognitoId: string,
    attendance: any,
    extraMeta: Record<string, any> = {}
) => {
    try {
        await prisma.auditLog.create({
            data: {
                action,
                entity: "Attendance",
                entityId,
                meta: {
                    employeeCognitoId:
                        attendance.adminCognitoId ||
                        attendance.accountsCognitoId ||
                        attendance.staffCognitoId,
                    checkInTime: attendance.checkInTime?.toISOString(),
                    checkOutTime: attendance.checkOutTime?.toISOString(),
                    totalHours: attendance.totalHours,
                    status: attendance.status,
                    breakType: attendance.breakType,
                    autoCheckedOut: attendance.autoCheckedOut,
                    role,
                    cognitoId,
                    ...extraMeta,
                },
                [actorFieldMap[role]]: cognitoId,
            },
        });
    } catch (auditError) {
        console.warn(`Failed to create audit log for ${action}:`, auditError);
    }
};

const autoCheckout = async () => {
    try {

        // Find all open sessions (CHECKED_IN with no checkOutTime)
        const openSessions = await prisma.attendance.findMany({
            where: {
                status: AttendanceStatus.CHECKED_IN,
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

            await prisma.$transaction(async (tx) => {
                const updatedAttendance = await tx.attendance.update({
                    where: { id: session.id },
                    data: {
                        checkOutTime: autoCheckOutTime,
                        checkOutLat: session.checkInLat,
                        checkOutLng: session.checkInLng,
                        totalHours,
                        status: AttendanceStatus.CHECKED_OUT,
                        autoCheckedOut: true,
                    },
                });

                const role = updatedAttendance.adminCognitoId
                    ? "admin"
                    : updatedAttendance.accountsCognitoId
                        ? "accounts"
                        : "staff";
                const cognitoId =
                    updatedAttendance.adminCognitoId ||
                    updatedAttendance.accountsCognitoId ||
                    updatedAttendance.staffCognitoId ||
                    "system";

                await createAuditLog(
                    "AUTO_CHECK_OUT",
                    updatedAttendance.id.toString(),
                    role,
                    cognitoId,
                    updatedAttendance,
                    {
                        reason: "Scheduled auto-checkout at 10:00 PM EAT",
                        autoCheckOutTime: autoCheckOutTime.toISOString(),
                    }
                );

                processed++;
            });
        }

       return { status: "success", processed };
    } catch (error) {
        console.error("Error in auto-checkout job:", {
            message: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString(),
        });
        throw error;
    } finally {
        await prisma.$disconnect();
    }
};

// Run immediately
autoCheckout()
    .then((result) => {
        process.exit(0);
    })
    .catch((err) => {
        console.error("Auto-checkout failed:", err);
        process.exit(1);
    });