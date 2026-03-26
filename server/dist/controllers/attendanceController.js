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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAttendanceReport = exports.getUserActivityStatus = exports.getBreakAnalytics = exports.endBreak = exports.startBreak = exports.getAutoCheckoutReport = exports.getLateCheckIns = exports.getAttendanceTrends = exports.getAttendanceSummary = exports.getFrequentSessions = exports.checkOut = exports.checkIn = exports.getAttendanceRecords = void 0;
const client_1 = require("@prisma/client");
const geolib_1 = require("geolib");
const date_fns_1 = require("date-fns");
const nodemailer_1 = __importDefault(require("nodemailer"));
// Initialize Prisma client
const prisma = new client_1.PrismaClient();
// Environment variable validation
const REFERENCE_LATITUDE = parseFloat(process.env.JOB_SITE_LAT || "");
const REFERENCE_LONGITUDE = parseFloat(process.env.JOB_SITE_LNG || "");
const GEOFENCE_RADIUS_METERS = parseFloat(process.env.GEOFENCE_RADIUS || "");
const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const NOTIFICATION_EMAIL = "hesbon@darubiniscreening.com";
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
if (!SMTP_HOST || isNaN(SMTP_PORT) || !SMTP_USER || !SMTP_PASS) {
    console.error("Invalid SMTP configuration in environment variables", {
        smtpHost: SMTP_HOST,
        smtpPort: SMTP_PORT,
        smtpUser: SMTP_USER,
        smtpPass: SMTP_PASS ? "[REDACTED]" : "",
    });
    throw new Error("Invalid SMTP configuration in environment variables");
}
// Initialize Nodemailer transporter
const transporter = nodemailer_1.default.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // Use SSL/TLS for port 465
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
    },
});
// Email templates
const CHECK_IN_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Attendance Check-In Notification</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 10px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .footer { text-align: center; font-size: 0.9em; color: #777; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Attendance Check-In Notification</h2>
        </div>
        <div class="content">
            <p><strong>Username:</strong> {{username}}</p>
            <p><strong>Check-In Time:</strong> {{checkInTime}}</p>
        </div>
        <div class="footer">
            <p>This is an automated notification from the Attendance System.</p>
        </div>
    </div>
</body>
</html>
`;
const CHECK_OUT_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Attendance Check-Out Notification</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #F44336; color: white; padding: 10px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .footer { text-align: center; font-size: 0.9em; color: #777; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Attendance Check-Out Notification</h2>
        </div>
        <div class="content">
            <p><strong>Username:</strong> {{username}}</p>
            <p><strong>Check-Out Time:</strong> {{checkOutTime}}</p>
            <p><strong>Reason for Check-Out:</strong> {{reason}}</p>
        </div>
        <div class="footer">
            <p>This is an automated notification from the Attendance System.</p>
        </div>
    </div>
</body>
</html>
`;
// Utility function to normalize role to PrismaUserRole
const normalizeRole = (role) => {
    const normalized = role.toUpperCase();
    if (!["ADMIN", "ACCOUNTS", "STAFF", "USER"].includes(normalized)) {
        throw new Error(`Invalid role: ${role}`);
    }
    return normalized;
};
// Utility function to calculate week of the month
const getWeekOfMonth = (date) => {
    const startOfMonthDate = (0, date_fns_1.startOfMonth)(date);
    const dayOfMonth = date.getDate();
    const firstDayOfWeek = startOfMonthDate.getDay();
    return Math.ceil((dayOfMonth + firstDayOfWeek) / 7);
};
// Utility function to get user username based on role
const getUserUsername = (cognitoId, role) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let user;
        if (role === "ADMIN") {
            user = yield prisma.admin.findUnique({ where: { cognitoId } });
        }
        else if (role === "ACCOUNTS") {
            user = yield prisma.accounts.findUnique({ where: { cognitoId } });
        }
        else if (role === "STAFF") {
            user = yield prisma.staff.findUnique({ where: { cognitoId } });
        }
        else {
            user = yield prisma.user.findUnique({ where: { cognitoId } });
        }
        return (user === null || user === void 0 ? void 0 : user.name) || "Unknown";
    }
    catch (error) {
        console.error(`Error fetching username for cognitoId ${cognitoId}:`, error);
        return "Unknown";
    }
});
// Utility function to send email notifications
const sendEmailNotification = (to, subject, username, action, time, breakType) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Verify transporter
        yield transporter.verify();
        const template = action === "Check-In" ? CHECK_IN_EMAIL_TEMPLATE : CHECK_OUT_EMAIL_TEMPLATE;
        const formattedTime = (0, date_fns_1.format)(time, 'PP HH:mm:ss');
        let html = template
            .replace('{{username}}', username)
            .replace(action === "Check-In" ? '{{checkInTime}}' : '{{checkOutTime}}', formattedTime);
        if (action === "Check-Out") {
            html = html.replace('{{reason}}', breakType || 'No Break Taken');
        }
        const mailOptions = {
            from: SMTP_USER,
            to,
            subject,
            html,
        };
        yield transporter.sendMail(mailOptions);
        return { success: true };
    }
    catch (error) {
        return { success: false, error: error };
    }
});
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
                        attendance.staffCognitoId ||
                        attendance.userCognitoId, checkInTime: (_a = attendance.checkInTime) === null || _a === void 0 ? void 0 : _a.toISOString(), checkOutTime: (_b = attendance.checkOutTime) === null || _b === void 0 ? void 0 : _b.toISOString(), totalHours: attendance.totalHours, status: attendance.status, breakType: attendance.breakType, autoCheckedOut: attendance.autoCheckedOut, role,
                    cognitoId }, extraMeta),
                [role === "ADMIN" ? "actorAdminCognitoId" :
                    role === "ACCOUNTS" ? "actorAccountsCognitoId" :
                        role === "STAFF" ? "actorStaffCognitoId" : "actorUserCognitoId"]: cognitoId,
            },
        });
    }
    catch (auditError) {
        console.warn(`Failed to create audit log for ${action}:`, auditError);
    }
});
const getAttendanceRecords = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Validate authenticated user
        if (!req.user) {
            console.warn('No authenticated user found');
            res.status(401).json({ message: "Please log in to view attendance records" });
            return;
        }
        const { id: cognitoId, role: rawRole } = req.user;
        const role = normalizeRole(rawRole);
        // Validate user role
        const allowedRoles = ["ADMIN", "ACCOUNTS", "STAFF", "USER"];
        if (!allowedRoles.includes(role)) {
            console.warn(`Access denied: Role ${role} not authorized`);
            res.status(403).json({ message: "You don't have permission to view attendance records." });
            return;
        }
        // Build where clause (no filters, role-based access)
        const where = {};
        if (role !== "ADMIN") {
            if (role === "ACCOUNTS") {
                where.accountsCognitoId = cognitoId;
            }
            else if (role === "STAFF") {
                where.staffCognitoId = cognitoId;
            }
            else if (role === "USER") {
                where.userCognitoId = cognitoId;
            }
        }
        // Fetch total count
        const total = yield prisma.attendance.count({ where });
        // Fetch all records
        const records = yield prisma.attendance.findMany({
            where,
            include: {
                admin: true,
                accounts: true,
                staff: true,
                user: true,
            },
            orderBy: { checkInTime: "desc" },
        });
        // Enrich records with usernames if relations are missing
        const enrichedRecords = yield Promise.all(records.map((record) => __awaiter(void 0, void 0, void 0, function* () {
            if (!record.admin && !record.accounts && !record.staff && !record.user) {
                const cognitoId = record.adminCognitoId || record.accountsCognitoId || record.staffCognitoId || record.userCognitoId;
                if (cognitoId) {
                    try {
                        if (record.adminCognitoId) {
                            record.admin = yield prisma.admin.findUnique({ where: { cognitoId } });
                        }
                        else if (record.accountsCognitoId) {
                            record.accounts = yield prisma.accounts.findUnique({ where: { cognitoId } });
                        }
                        else if (record.staffCognitoId) {
                            record.staff = yield prisma.staff.findUnique({ where: { cognitoId } });
                        }
                        else if (record.userCognitoId) {
                            record.user = yield prisma.user.findUnique({ where: { cognitoId } });
                        }
                    }
                    catch (error) {
                        console.error(`Error fetching user data for cognitoId ${cognitoId}:`, error);
                    }
                }
            }
            return record;
        })));
        // Create audit log
        yield createAuditLog("READ", "multiple", role, cognitoId, {}, {
            count: enrichedRecords.length,
        });
        res.json({
            records: enrichedRecords,
            total,
        });
    }
    catch (error) {
        console.error('Error retrieving attendance records:', error);
        res.status(500).json({ message: 'Something went wrong.' });
    }
});
exports.getAttendanceRecords = getAttendanceRecords;
const checkIn = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { latitude, longitude, breakType } = req.body;
        const user = req.user;
        const role = normalizeRole(user.role);
        // Validate breakType if provided
        if (breakType && !Object.values(client_1.BreakType).includes(breakType)) {
            console.warn('Invalid break type provided', { breakType, userId: user.id, role });
            res.status(400).json({ message: 'Invalid break type' });
            return;
        }
        // Check for existing active check-in
        const existingCheckIn = yield prisma.attendance.findFirst({
            where: {
                [role === "ADMIN" ? "adminCognitoId" :
                    role === "ACCOUNTS" ? "accountsCognitoId" :
                        role === "STAFF" ? "staffCognitoId" : "userCognitoId"]: user.id,
                status: 'CHECKED_IN',
                checkOutTime: null,
            },
            include: { admin: true, accounts: true, staff: true, user: true },
        });
        if (existingCheckIn) {
            yield createAuditLog("CHECK_IN_ATTEMPT_ALREADY_CHECKED_IN", existingCheckIn.id.toString(), role, user.id, existingCheckIn, {
                attemptedLatitude: latitude,
                attemptedLongitude: longitude,
                attemptedBreakType: breakType || 'None',
            });
            res.status(200).json({
                message: 'You are already checked in',
                attendance: existingCheckIn,
            });
            return;
        }
        const distance = (0, geolib_1.getDistance)({ latitude, longitude }, { latitude: REFERENCE_LATITUDE, longitude: REFERENCE_LONGITUDE });
        if (distance > GEOFENCE_RADIUS_METERS) {
            console.warn('Geofence validation failed', { distance, maxRadius: GEOFENCE_RADIUS_METERS });
            res.status(400).json({ message: 'Outside geofence' });
            return;
        }
        const attendance = yield prisma.attendance.create({
            data: {
                [role === "ADMIN" ? "adminCognitoId" :
                    role === "ACCOUNTS" ? "accountsCognitoId" :
                        role === "STAFF" ? "staffCognitoId" : "userCognitoId"]: user.id,
                checkInTime: new Date(),
                status: 'CHECKED_IN',
                checkInLat: latitude,
                checkInLng: longitude,
                breakType: breakType || null, // Include breakType if provided
            },
            include: { admin: true, accounts: true, staff: true, user: true },
        });
        // Fetch user username
        const username = yield getUserUsername(user.id, role);
        const emailResult = yield sendEmailNotification(NOTIFICATION_EMAIL, `Attendance Check-In: ${username}`, username, "Check-In", attendance.checkInTime);
        // Create audit log with email result
        yield createAuditLog("CHECK_IN", attendance.id.toString(), role, user.id, attendance, {
            emailNotificationSent: emailResult.success,
            emailError: emailResult.success ? undefined : (_a = emailResult.error) === null || _a === void 0 ? void 0 : _a.message,
        });
        res.status(201).json(attendance);
    }
    catch (error) {
        console.error('Check-in error', {
            error: error.message,
            stack: error.stack,
            user: req.user,
            timestamp: new Date().toISOString(),
        });
        res.status(500).json({ message: 'Check-in failed' });
    }
});
exports.checkIn = checkIn;
const checkOut = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { latitude, longitude } = req.body;
        const user = req.user;
        const role = normalizeRole(user.role);
        const attendance = yield prisma.attendance.findFirst({
            where: {
                [role === "ADMIN" ? "adminCognitoId" :
                    role === "ACCOUNTS" ? "accountsCognitoId" :
                        role === "STAFF" ? "staffCognitoId" : "userCognitoId"]: user.id,
                status: 'CHECKED_IN',
                checkOutTime: null,
            },
            include: { admin: true, accounts: true, staff: true, user: true },
        });
        if (!attendance) {
            console.warn('No active check-in found', { userId: user.id, role });
            res.status(404).json({ message: 'No active check-in found' });
            return;
        }
        const updatedAttendance = yield prisma.attendance.update({
            where: { id: attendance.id },
            data: {
                checkOutTime: new Date(),
                status: 'CHECKED_OUT',
                checkOutLat: latitude,
                checkOutLng: longitude,
                totalHours: { set: (new Date().getTime() - new Date(attendance.checkInTime).getTime()) / (1000 * 60 * 60) },
            },
            include: { admin: true, accounts: true, staff: true, user: true },
        });
        // Fetch user username
        const username = yield getUserUsername(user.id, role);
        const emailResult = yield sendEmailNotification(NOTIFICATION_EMAIL, `Attendance Check-Out: ${username}`, username, "Check-Out", updatedAttendance.checkOutTime, attendance.breakType);
        // Create audit log with email result
        yield createAuditLog("CHECK_OUT", updatedAttendance.id.toString(), role, user.id, updatedAttendance, {
            emailNotificationSent: emailResult.success,
            emailError: emailResult.success ? undefined : (_a = emailResult.error) === null || _a === void 0 ? void 0 : _a.message,
        });
        res.json(updatedAttendance);
    }
    catch (error) {
        console.error('Check-out error', {
            error: error.message,
            stack: error.stack,
            user: req.user,
            timestamp: new Date().toISOString(),
        });
        res.status(500).json({ message: 'Check-out failed' });
    }
});
exports.checkOut = checkOut;
const getFrequentSessions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Please log in" });
            return;
        }
        const { id: cognitoId, role: rawRole } = req.user;
        const role = normalizeRole(rawRole);
        if (role !== "ADMIN") {
            res.status(403).json({ message: "Only admins can view frequent sessions" });
            return;
        }
        const frequentSessions = yield prisma.attendance.groupBy({
            by: ["adminCognitoId", "accountsCognitoId", "staffCognitoId", "userCognitoId"],
            _count: {
                id: true,
            },
            having: {
                id: {
                    _count: {
                        gte: 3,
                    },
                },
            },
        });
        const enrichedResults = yield Promise.all(frequentSessions.map((group) => __awaiter(void 0, void 0, void 0, function* () {
            const cognitoId = group.adminCognitoId || group.accountsCognitoId || group.staffCognitoId || group.userCognitoId;
            if (!cognitoId) {
                return {
                    cognitoId: "unknown",
                    username: "Unknown",
                    sessionCount: group._count.id,
                };
            }
            const user = (yield prisma.admin.findUnique({ where: { cognitoId } })) ||
                (yield prisma.accounts.findUnique({ where: { cognitoId } })) ||
                (yield prisma.staff.findUnique({ where: { cognitoId } })) ||
                (yield prisma.user.findUnique({ where: { cognitoId } }));
            return {
                cognitoId,
                username: (user === null || user === void 0 ? void 0 : user.name) || "Unknown",
                sessionCount: group._count.id,
            };
        })));
        yield createAuditLog("READ_FREQUENT_SESSIONS", "multiple", role, cognitoId, {}, {
            count: enrichedResults.length,
        });
        res.json({
            records: enrichedResults,
            total: enrichedResults.length,
        });
    }
    catch (error) {
        console.error("Error retrieving frequent sessions:", error);
        res.status(500).json({ message: "Something went wrong." });
    }
});
exports.getFrequentSessions = getFrequentSessions;
const getAttendanceSummary = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Please log in" });
            return;
        }
        const { id: cognitoId, role: rawRole } = req.user;
        const role = normalizeRole(rawRole);
        const where = {};
        if (role !== "ADMIN") {
            if (role === "ACCOUNTS") {
                where.accountsCognitoId = cognitoId;
            }
            else if (role === "STAFF") {
                where.staffCognitoId = cognitoId;
            }
            else if (role === "USER") {
                where.userCognitoId = cognitoId;
            }
        }
        const records = yield prisma.attendance.findMany({
            where,
            include: { admin: true, accounts: true, staff: true, user: true },
        });
        const totalHours = records.reduce((sum, r) => sum + (r.totalHours || 0), 0);
        const sessionCount = records.length;
        const compliantCheckIns = records.filter(r => r.checkInLat && r.checkInLng &&
            (0, geolib_1.getDistance)({ latitude: r.checkInLat.toNumber(), longitude: r.checkInLng.toNumber() }, { latitude: REFERENCE_LATITUDE, longitude: REFERENCE_LONGITUDE }) <= GEOFENCE_RADIUS_METERS).length;
        const summary = {
            totalHours,
            sessionCount,
            averageSessionDuration: sessionCount ? totalHours / sessionCount : 0,
            complianceRate: sessionCount ? (compliantCheckIns / sessionCount) * 100 : 0,
        };
        yield createAuditLog("READ_ATTENDANCE_SUMMARY", "multiple", role, cognitoId, {}, { metrics: Object.keys(summary) });
        res.json(summary);
    }
    catch (error) {
        console.error("Error retrieving attendance summary:", error);
        res.status(500).json({ message: "Something went wrong." });
    }
});
exports.getAttendanceSummary = getAttendanceSummary;
const getAttendanceTrends = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Please log in" });
            return;
        }
        const { id: cognitoId, role: rawRole } = req.user;
        const role = normalizeRole(rawRole);
        const where = {};
        if (role !== "ADMIN") {
            if (role === "ACCOUNTS") {
                where.accountsCognitoId = cognitoId;
            }
            else if (role === "STAFF") {
                where.staffCognitoId = cognitoId;
            }
            else if (role === "USER") {
                where.userCognitoId = cognitoId;
            }
        }
        const records = yield prisma.attendance.findMany({ where });
        const trends = {
            byDayOfWeek: Array(7).fill(0).map((_, i) => ({
                day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][i],
                count: records.filter(r => r.checkInTime && (0, date_fns_1.getDay)(r.checkInTime) === i).length,
                totalHours: records.filter(r => r.checkInTime && (0, date_fns_1.getDay)(r.checkInTime) === i).reduce((sum, r) => sum + (r.totalHours || 0), 0),
            })),
            byHourOfDay: Array(24).fill(0).map((_, i) => ({
                hour: i,
                count: records.filter(r => r.checkInTime && (0, date_fns_1.getHours)(r.checkInTime) === i).length,
            })),
            byWeekOfMonth: Array(5).fill(0).map((_, i) => ({
                week: i + 1,
                count: records.filter(r => r.checkInTime && getWeekOfMonth(r.checkInTime) === i + 1).length,
                totalHours: records.filter(r => r.checkInTime && getWeekOfMonth(r.checkInTime) === i + 1).reduce((sum, r) => sum + (r.totalHours || 0), 0),
            })),
        };
        yield createAuditLog("READ_TRENDS", "multiple", role, cognitoId, {}, { metrics: Object.keys(trends) });
        res.json(trends);
    }
    catch (error) {
        console.error("Error retrieving trends:", error);
        res.status(500).json({ message: "Something went wrong." });
    }
});
exports.getAttendanceTrends = getAttendanceTrends;
const getLateCheckIns = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Please log in" });
            return;
        }
        const { id: cognitoId, role: rawRole } = req.user;
        const role = normalizeRole(rawRole);
        const where = {};
        if (role !== "ADMIN") {
            if (role === "ACCOUNTS") {
                where.accountsCognitoId = cognitoId;
            }
            else if (role === "STAFF") {
                where.staffCognitoId = cognitoId;
            }
            else if (role === "USER") {
                where.userCognitoId = cognitoId;
            }
        }
        const records = yield prisma.attendance.findMany({
            where,
            include: { admin: true, accounts: true, staff: true, user: true },
        });
        const lateCheckIns = records.filter(r => r.checkInTime && (0, date_fns_1.getHours)(r.checkInTime) >= 9).length;
        yield createAuditLog("READ_LATE_CHECKINS", "multiple", role, cognitoId, {}, { count: lateCheckIns });
        res.json({ lateCheckIns });
    }
    catch (error) {
        console.error("Error retrieving late check-ins:", error);
        res.status(500).json({ message: "Something went wrong." });
    }
});
exports.getLateCheckIns = getLateCheckIns;
const getAutoCheckoutReport = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Please log in" });
            return;
        }
        const { id: cognitoId, role: rawRole } = req.user;
        const role = normalizeRole(rawRole);
        const where = role !== "ADMIN" ? {
            [role === "ACCOUNTS" ? "accountsCognitoId" :
                role === "STAFF" ? "staffCognitoId" : "userCognitoId"]: cognitoId,
            autoCheckedOut: true
        } : { autoCheckedOut: true };
        const autoCheckouts = yield prisma.attendance.count({ where });
        yield createAuditLog("READ_AUTO_CHECKOUTS", "multiple", role, cognitoId, {}, { count: autoCheckouts });
        res.json({ autoCheckouts });
    }
    catch (error) {
        console.error("Error retrieving auto-checkout report:", error);
        res.status(500).json({ message: "Something went wrong." });
    }
});
exports.getAutoCheckoutReport = getAutoCheckoutReport;
const startBreak = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { breakType, latitude, longitude } = req.body;
        const user = req.user;
        const role = normalizeRole(user.role);
        if (!Object.values(client_1.BreakType).includes(breakType)) {
            res.status(400).json({ message: "Invalid break type" });
            return;
        }
        const distance = (0, geolib_1.getDistance)({ latitude, longitude }, { latitude: REFERENCE_LATITUDE, longitude: REFERENCE_LONGITUDE });
        if (distance > GEOFENCE_RADIUS_METERS) {
            console.warn('Geofence validation failed for break', { distance, maxRadius: GEOFENCE_RADIUS_METERS });
            res.status(400).json({ message: 'Outside geofence' });
            return;
        }
        const attendance = yield prisma.attendance.findFirst({
            where: {
                [role === "ADMIN" ? "adminCognitoId" :
                    role === "ACCOUNTS" ? "accountsCognitoId" :
                        role === "STAFF" ? "staffCognitoId" : "userCognitoId"]: user.id,
                status: 'CHECKED_IN',
                checkOutTime: null,
                breakType: null,
            },
        });
        if (!attendance) {
            res.status(404).json({ message: 'No active check-in found or break already started' });
            return;
        }
        const updatedAttendance = yield prisma.attendance.update({
            where: { id: attendance.id },
            data: { breakType },
        });
        yield createAuditLog("START_BREAK", updatedAttendance.id.toString(), role, user.id, updatedAttendance, { breakType });
        res.status(201).json(updatedAttendance);
    }
    catch (error) {
        console.error('Start break error', error);
        res.status(500).json({ message: 'Start break failed' });
    }
});
exports.startBreak = startBreak;
const endBreak = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { latitude, longitude } = req.body;
        const user = req.user;
        const role = normalizeRole(user.role);
        const distance = (0, geolib_1.getDistance)({ latitude, longitude }, { latitude: REFERENCE_LATITUDE, longitude: REFERENCE_LONGITUDE });
        if (distance > GEOFENCE_RADIUS_METERS) {
            console.warn('Geofence validation failed for break', { distance, maxRadius: GEOFENCE_RADIUS_METERS });
            res.status(400).json({ message: 'Outside geofence' });
            return;
        }
        const attendance = yield prisma.attendance.findFirst({
            where: {
                [role === "ADMIN" ? "adminCognitoId" :
                    role === "ACCOUNTS" ? "accountsCognitoId" :
                        role === "STAFF" ? "staffCognitoId" : "userCognitoId"]: user.id,
                status: 'CHECKED_IN',
                breakType: { not: null },
            },
        });
        if (!attendance) {
            res.status(404).json({ message: 'No active break found' });
            return;
        }
        const updatedAttendance = yield prisma.attendance.update({
            where: { id: attendance.id },
            data: { breakType: null },
        });
        yield createAuditLog("END_BREAK", updatedAttendance.id.toString(), role, user.id, updatedAttendance, { breakType: attendance.breakType });
        res.json(updatedAttendance);
    }
    catch (error) {
        console.error('End break error', error);
        res.status(500).json({ message: 'End break failed' });
    }
});
exports.endBreak = endBreak;
const getBreakAnalytics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Please log in" });
            return;
        }
        const { id: cognitoId, role: rawRole } = req.user;
        const role = normalizeRole(rawRole);
        const where = {};
        if (role !== "ADMIN") {
            if (role === "ACCOUNTS") {
                where.accountsCognitoId = cognitoId;
            }
            else if (role === "STAFF") {
                where.staffCognitoId = cognitoId;
            }
            else if (role === "USER") {
                where.userCognitoId = cognitoId;
            }
        }
        const records = yield prisma.attendance.findMany({
            where,
            include: { admin: true, accounts: true, staff: true, user: true },
        });
        const breaks = records.filter(r => r.breakType);
        const analytics = {
            totalBreaks: breaks.length,
            byType: Object.values(client_1.BreakType).reduce((acc, type) => {
                acc[type] = breaks.filter(b => b.breakType === type).length;
                return acc;
            }, {}),
        };
        yield createAuditLog("READ_BREAK_ANALYTICS", "multiple", role, cognitoId, {}, { totalBreaks: analytics.totalBreaks });
        res.json(analytics);
    }
    catch (error) {
        console.error("Error retrieving break analytics:", error);
        res.status(500).json({ message: "Something went wrong." });
    }
});
exports.getBreakAnalytics = getBreakAnalytics;
const getUserActivityStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Please log in" });
            return;
        }
        const { id: cognitoId, role: rawRole } = req.user;
        const role = normalizeRole(rawRole);
        const where = {};
        if (role !== "ADMIN") {
            if (role === "ACCOUNTS") {
                where.accountsCognitoId = cognitoId;
            }
            else if (role === "STAFF") {
                where.staffCognitoId = cognitoId;
            }
            else if (role === "USER") {
                where.userCognitoId = cognitoId;
            }
        }
        const records = yield prisma.attendance.findMany({
            where,
            include: { admin: true, accounts: true, staff: true, user: true },
            orderBy: { checkInTime: "desc" },
        });
        const uniqueUsers = [...new Set(records.map(r => r.adminCognitoId || r.accountsCognitoId || r.staffCognitoId || r.userCognitoId))];
        const totalCheckedIn = records.filter(r => r.status === "CHECKED_IN" && !r.checkOutTime && !r.breakType).length;
        const totalOnBreak = records.filter(r => r.breakType).length;
        const totalCheckedOut = uniqueUsers.length - totalCheckedIn - totalOnBreak;
        const statuses = {
            totalUsers: uniqueUsers.length,
            checkedIn: totalCheckedIn,
            onBreak: totalOnBreak,
            checkedOut: totalCheckedOut,
        };
        yield createAuditLog("READ_USER_STATUS", "multiple", role, cognitoId, {}, { totalUsers: uniqueUsers.length });
        res.json(statuses);
    }
    catch (error) {
        console.error("Error retrieving user activity status:", error);
        res.status(500).json({ message: "Something went wrong." });
    }
});
exports.getUserActivityStatus = getUserActivityStatus;
const generateAttendanceReport = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Please log in" });
            return;
        }
        const { id: cognitoId, role: rawRole } = req.user;
        const role = normalizeRole(rawRole);
        const where = {};
        if (role !== "ADMIN") {
            if (role === "ACCOUNTS") {
                where.accountsCognitoId = cognitoId;
            }
            else if (role === "STAFF") {
                where.staffCognitoId = cognitoId;
            }
            else if (role === "USER") {
                where.userCognitoId = cognitoId;
            }
        }
        const records = yield prisma.attendance.findMany({
            where,
            include: { admin: true, accounts: true, staff: true, user: true },
            orderBy: { checkInTime: "desc" },
        });
        const report = records.map(r => {
            var _a, _b, _c, _d;
            return ({
                id: r.id,
                userId: r.adminCognitoId || r.accountsCognitoId || r.staffCognitoId || r.userCognitoId,
                username: ((_a = r.admin) === null || _a === void 0 ? void 0 : _a.name) || ((_b = r.accounts) === null || _b === void 0 ? void 0 : _b.name) || ((_c = r.staff) === null || _c === void 0 ? void 0 : _c.name) || ((_d = r.user) === null || _d === void 0 ? void 0 : _d.name) || "Unknown",
                checkInTime: r.checkInTime,
                checkOutTime: r.checkOutTime,
                totalHours: r.totalHours,
                status: r.status,
                breakType: r.breakType,
                autoCheckedOut: r.autoCheckedOut,
            });
        });
        yield createAuditLog("GENERATE_ATTENDANCE_REPORT", "multiple", role, cognitoId, {}, { count: report.length });
        res.json({ report, total: report.length });
    }
    catch (error) {
        console.error("Error generating attendance report:", error);
        res.status(500).json({ message: "Something went wrong." });
    }
});
exports.generateAttendanceReport = generateAttendanceReport;
