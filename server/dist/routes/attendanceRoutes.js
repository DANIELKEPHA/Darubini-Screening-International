"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const attendanceController_1 = require("../controllers/attendanceController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Employee action routes (accessible to admin, accounts, staff, user)
router.post("/check-in", (0, authMiddleware_1.authMiddleware)(["admin", "accounts", "staff"]), attendanceController_1.checkIn);
router.post("/check-out", (0, authMiddleware_1.authMiddleware)(["admin", "accounts", "staff"]), attendanceController_1.checkOut);
router.post("/start-break", (0, authMiddleware_1.authMiddleware)(["admin", "accounts", "staff"]), attendanceController_1.startBreak);
router.post("/end-break", (0, authMiddleware_1.authMiddleware)(["admin", "accounts", "staff"]), attendanceController_1.endBreak);
// Attendance records route (accessible to admin, accounts, staff)
router.get("/", (0, authMiddleware_1.authMiddleware)(["admin", "accounts", "staff"]), attendanceController_1.getAttendanceRecords);
// Report and analytics routes (accessible to admin, accounts, staff, user)
router.get("/summary", (0, authMiddleware_1.authMiddleware)(["admin", "accounts", "staff"]), attendanceController_1.getAttendanceSummary);
router.get("/trends", (0, authMiddleware_1.authMiddleware)(["admin", "accounts", "staff"]), attendanceController_1.getAttendanceTrends);
router.get("/late-check-ins", (0, authMiddleware_1.authMiddleware)(["admin", "accounts", "staff"]), attendanceController_1.getLateCheckIns);
router.get("/auto-checkouts", (0, authMiddleware_1.authMiddleware)(["admin", "accounts", "staff"]), attendanceController_1.getAutoCheckoutReport);
router.get("/break-analytics", (0, authMiddleware_1.authMiddleware)(["admin", "accounts", "staff"]), attendanceController_1.getBreakAnalytics);
router.get("/user-activity-status", (0, authMiddleware_1.authMiddleware)(["admin", "accounts", "staff"]), attendanceController_1.getUserActivityStatus);
router.get("/attendance-report", (0, authMiddleware_1.authMiddleware)(["admin", "accounts", "staff"]), attendanceController_1.generateAttendanceReport);
// Frequent sessions report route (accessible to admin only)
router.get("/frequent-sessions", (0, authMiddleware_1.authMiddleware)(["admin"]), attendanceController_1.getFrequentSessions);
exports.default = router;
