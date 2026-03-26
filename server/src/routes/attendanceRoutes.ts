import express from "express";
import {
    checkIn,
    checkOut,
    getAttendanceRecords,
    getFrequentSessions,
    getAttendanceSummary,
    getAttendanceTrends,
    getLateCheckIns,
    getAutoCheckoutReport,
    startBreak,
    endBreak,
    getBreakAnalytics,
    getUserActivityStatus,
    generateAttendanceReport,
} from "../controllers/attendanceController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

// Employee action routes (accessible to admin, accounts, staff, user)
router.post("/check-in", authMiddleware(["admin", "accounts", "staff", "user"]), checkIn);
router.post("/check-out", authMiddleware(["admin", "accounts", "staff", "user"]), checkOut);
router.post("/start-break", authMiddleware(["admin", "accounts", "staff", "user"]), startBreak);
router.post("/end-break", authMiddleware(["admin", "accounts", "staff", "user"]), endBreak);

// Attendance records route (accessible to admin, accounts, staff)
router.get("/", authMiddleware(["admin", "accounts", "staff"]), getAttendanceRecords);

// Report and analytics routes (accessible to admin, accounts, staff, user)
router.get("/summary", authMiddleware(["admin", "accounts", "staff", "user"]), getAttendanceSummary);
router.get("/trends", authMiddleware(["admin", "accounts", "staff", "user"]), getAttendanceTrends);
router.get("/late-check-ins", authMiddleware(["admin", "accounts", "staff", "user"]), getLateCheckIns);
router.get("/auto-checkouts", authMiddleware(["admin", "accounts", "staff", "user"]), getAutoCheckoutReport);
router.get("/break-analytics", authMiddleware(["admin", "accounts", "staff", "user"]), getBreakAnalytics);
router.get("/user-activity-status", authMiddleware(["admin", "accounts", "staff", "user"]), getUserActivityStatus);
router.get("/attendance-report", authMiddleware(["admin", "accounts", "staff", "user"]), generateAttendanceReport);

// Frequent sessions report route (accessible to admin only)
router.get("/frequent-sessions", authMiddleware(["admin"]), getFrequentSessions);

export default router;