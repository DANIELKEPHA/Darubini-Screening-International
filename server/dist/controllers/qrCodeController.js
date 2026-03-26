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
exports.validateQRCode = exports.generateQRCode = void 0;
const qrcode_1 = __importDefault(require("qrcode"));
const client_1 = require("@prisma/client");
const geolib_1 = require("geolib");
// Initialize Prisma client
const prisma = new client_1.PrismaClient();
// Environment variable validation
const LOCATION_ID = process.env.LOCATION_ID;
const FRONTEND_URL = process.env.FRONTEND_URL || '';
const REFERENCE_LATITUDE = parseFloat(process.env.JOB_SITE_LAT || '');
const REFERENCE_LONGITUDE = parseFloat(process.env.JOB_SITE_LNG || '');
const GEOFENCE_RADIUS_METERS = parseFloat(process.env.GEOFENCE_RADIUS || '');
if (!LOCATION_ID) {
    console.error('Missing LOCATION_ID in environment variables');
    throw new Error('Missing LOCATION_ID in environment variables');
}
if (!FRONTEND_URL) {
    console.error('Missing FRONTEND_URL in environment variables');
    throw new Error('Missing FRONTEND_URL in environment variables');
}
if (isNaN(REFERENCE_LATITUDE) || REFERENCE_LATITUDE < -90 || REFERENCE_LATITUDE > 90) {
    console.error('Invalid JOB_SITE_LAT in environment variables');
    throw new Error('Invalid JOB_SITE_LAT in environment variables');
}
if (isNaN(REFERENCE_LONGITUDE) || REFERENCE_LONGITUDE < -180 || REFERENCE_LONGITUDE > 180) {
    console.error('Invalid JOB_SITE_LNG in environment variables');
    throw new Error('Invalid JOB_SITE_LNG in environment variables');
}
if (isNaN(GEOFENCE_RADIUS_METERS) || GEOFENCE_RADIUS_METERS <= 0) {
    console.error('Invalid GEOFENCE_RADIUS in environment variables');
    throw new Error('Invalid GEOFENCE_RADIUS in environment variables');
}
// Map roles to Prisma model fields
const actorFieldMap = {
    admin: 'actorAdminCognitoId',
    accounts: 'actorAccountsCognitoId',
    staff: 'actorStaffCognitoId',
};
const modelFieldMap = {
    admin: 'adminCognitoId',
    accounts: 'accountsCognitoId',
    staff: 'staffCognitoId',
};
// Validate latitude and longitude
const validateNumber = (value, min, max, fieldName) => {
    const num = Number(value);
    if (isNaN(num) || num < min || num > max) {
        throw new Error(`${fieldName} must be a number between ${min} and ${max}`);
    }
    return num;
};
const validateLatitude = (lat) => validateNumber(lat, -90, 90, 'Latitude');
const validateLongitude = (lng) => validateNumber(lng, -180, 180, 'Longitude');
// Create audit log utility
const createAuditLog = (action_1, entityId_1, role_1, cognitoId_1, attendance_1, ...args_1) => __awaiter(void 0, [action_1, entityId_1, role_1, cognitoId_1, attendance_1, ...args_1], void 0, function* (action, entityId, role, cognitoId, attendance, extraMeta = {}) {
    var _a, _b;
    try {
        yield prisma.auditLog.create({
            data: {
                action,
                entity: 'Attendance',
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
// Generate permanent QR code for the site
const generateQRCode = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Validate authenticated user
        const user = req.user;
        if (!(user === null || user === void 0 ? void 0 : user.id)) {
            console.warn('No authenticated user found');
            res.status(401).json({ message: 'Unauthorized: Please log in to generate QR code' });
            return;
        }
        const { id: cognitoId, role } = user;
        // Restrict to admin role only
        if (role !== 'admin') {
            console.warn(`Access denied: Role ${role} not authorized to generate permanent QR code`);
            res.status(403).json({ message: 'Forbidden: Only admins can generate permanent QR codes' });
            return;
        }
        // Verify admin exists
        const adminExists = !!(yield prisma.admin.findUnique({ where: { cognitoId } }));
        if (!adminExists) {
            console.warn(`No admin found for cognitoId: ${cognitoId}`);
            res.status(400).json({ message: `No admin found for cognitoId: ${cognitoId}` });
            return;
        }
        // Generate QR code with URL including LOCATION_ID
        const qrCodeData = `${FRONTEND_URL}/scan?locationId=${LOCATION_ID}`;
        const qrCode = yield qrcode_1.default.toDataURL(qrCodeData);
        // Save audit log
        yield createAuditLog('GENERATE_PERMANENT_QR_CODE', LOCATION_ID, role, cognitoId, {}, { qrCodeData });
        res.json({
            qrCode,
            locationId: LOCATION_ID,
        });
    }
    catch (error) {
        console.error('Error generating QR code:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            user: req.user,
            timestamp: new Date().toISOString(),
        });
        res.status(500).json({ message: 'Failed to generate QR code' });
    }
    finally {
        yield prisma.$disconnect();
    }
});
exports.generateQRCode = generateQRCode;
// Validate QR code and perform check-in or check-out
const validateQRCode = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { locationId, latitude, longitude, breakType } = req.body;
        const user = req.user;
        // Validate authenticated user
        if (!(user === null || user === void 0 ? void 0 : user.id)) {
            console.warn('No authenticated user found');
            res.status(401).json({ message: 'Unauthorized: Please log in to validate QR code' });
            return;
        }
        const { id: cognitoId, role } = user;
        // Allow admin, accounts, or staff roles
        if (!['admin', 'accounts', 'staff'].includes(role)) {
            console.warn(`Access denied: Role ${role} not authorized to scan QR code`);
            res.status(403).json({ message: 'Forbidden: Only admin, accounts, or staff can scan QR codes' });
            return;
        }
        // Validate inputs
        if (!locationId || locationId !== LOCATION_ID) {
            console.warn('Invalid or missing locationId', { received: locationId, expected: LOCATION_ID });
            res.status(400).json({ message: 'Invalid QR code' });
            return;
        }
        if (latitude === undefined || longitude === undefined) {
            console.warn('Missing latitude or longitude');
            res.status(400).json({ message: 'Please provide your location to scan QR code' });
            return;
        }
        const validatedLatitude = validateLatitude(latitude);
        const validatedLongitude = validateLongitude(longitude);
        // Validate breakType
        const validBreakTypes = Object.values(client_1.BreakType);
        if (breakType && !validBreakTypes.includes(breakType)) {
            console.warn(`Invalid break type: ${breakType}`);
            res.status(400).json({ message: `Invalid break type. Must be one of: ${validBreakTypes.join(', ')}` });
            return;
        }
        // Perform geofence check
        const distance = (0, geolib_1.getDistance)({ latitude: validatedLatitude, longitude: validatedLongitude }, { latitude: REFERENCE_LATITUDE, longitude: REFERENCE_LONGITUDE });
        if (distance > GEOFENCE_RADIUS_METERS) {
            console.warn('Geofence validation failed', { distance, maxAllowed: GEOFENCE_RADIUS_METERS });
            res.status(400).json({
                message: `Scan not allowed: Location is ${distance} meters from the designated area, which exceeds the ${GEOFENCE_RADIUS_METERS}-meter limit.`,
            });
            return;
        }
        // Verify user exists based on role
        let userExists = false;
        if (role === 'admin') {
            userExists = !!(yield prisma.admin.findUnique({ where: { cognitoId } }));
        }
        else if (role === 'accounts') {
            userExists = !!(yield prisma.accounts.findUnique({ where: { cognitoId } }));
        }
        else if (role === 'staff') {
            userExists = !!(yield prisma.staff.findUnique({ where: { cognitoId } }));
        }
        if (!userExists) {
            console.warn(`No ${role} found for cognitoId: ${cognitoId}`);
            res.status(400).json({ message: `No ${role} found for cognitoId: ${cognitoId}` });
            return;
        }
        // Check for existing open session
        const existing = yield prisma.attendance.findFirst({
            where: {
                [modelFieldMap[role]]: cognitoId,
                status: client_1.AttendanceStatus.CHECKED_IN,
                checkOutTime: null,
            },
            orderBy: { checkInTime: 'desc' },
        });
        if (!existing) {
            // Perform check-in
            const checkInTime = new Date();
            const minuteTruncatedTime = new Date(checkInTime.getFullYear(), checkInTime.getMonth(), checkInTime.getDate(), checkInTime.getHours(), checkInTime.getMinutes(), 0, 0);
            const existingMinuteRecord = yield prisma.attendance.findFirst({
                where: {
                    [modelFieldMap[role]]: cognitoId,
                    checkInTime: {
                        gte: minuteTruncatedTime,
                        lt: new Date(minuteTruncatedTime.getTime() + 60 * 1000),
                    },
                },
            });
            if (existingMinuteRecord) {
                console.warn(`Check-in already recorded for ${role} ${cognitoId} in this minute`);
                res.status(409).json({ message: 'Check-in already recorded for this minute. Please wait a moment.' });
                return;
            }
            const attendance = yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
                const newAttendance = yield tx.attendance.create({
                    data: {
                        [modelFieldMap[role]]: cognitoId,
                        checkInTime,
                        checkInLat: validatedLatitude,
                        checkInLng: validatedLongitude,
                        status: client_1.AttendanceStatus.CHECKED_IN,
                        breakType: breakType || null,
                    },
                    include: {
                        admin: role === 'admin' ? true : false,
                        accounts: role === 'accounts' ? true : false,
                        staff: role === 'staff' ? true : false,
                    },
                });
                yield createAuditLog('CHECK_IN_QR', newAttendance.id.toString(), role, cognitoId, newAttendance, {
                    locationId,
                    latitude: validatedLatitude,
                    longitude: validatedLongitude,
                    distance,
                    breakType,
                });
                return newAttendance;
            }));
            res.status(201).json({
                message: 'Checked in successfully',
                attendance,
            });
        }
        else {
            // Perform check-out
            if (!existing.checkInTime) {
                console.warn(`Invalid check-in time for attendance ID ${existing.id}`);
                res.status(400).json({ message: 'Invalid check-in time' });
                return;
            }
            const checkOutTime = new Date();
            const totalHours = (checkOutTime.getTime() - existing.checkInTime.getTime()) / (1000 * 60 * 60);
            const updatedAttendance = yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
                const updated = yield tx.attendance.update({
                    where: { id: existing.id },
                    data: {
                        checkOutTime,
                        checkOutLat: validatedLatitude,
                        checkOutLng: validatedLongitude,
                        totalHours,
                        status: client_1.AttendanceStatus.CHECKED_OUT,
                        breakType: breakType || existing.breakType || null,
                    },
                    include: {
                        admin: role === 'admin' ? true : false,
                        accounts: role === 'accounts' ? true : false,
                        staff: role === 'staff' ? true : false,
                    },
                });
                yield createAuditLog('CHECK_OUT_QR', updated.id.toString(), role, cognitoId, updated, {
                    locationId,
                    latitude: validatedLatitude,
                    longitude: validatedLongitude,
                    distance,
                    totalHours,
                    breakType,
                });
                return updated;
            }));
            res.json({
                message: 'Checked out successfully',
                attendance: updatedAttendance,
            });
        }
    }
    catch (error) {
        console.error('Error validating QR code:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            body: req.body,
            user: req.user,
            timestamp: new Date().toISOString(),
        });
        res.status(500).json({ message: 'Failed to process QR code' });
    }
    finally {
        yield prisma.$disconnect();
    }
});
exports.validateQRCode = validateQRCode;
