import express from "express";
import {
    createLeaveRequest,
    getLeaveRequests,
    getMyLeaveRequests,
    getUserLeaveData,
    getUserLeaveBalance,
    approveLeave, rejectLeave, previewLeaveDecision, getLeaveBalance,
} from "../controllers/leaveController";

import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.post(
    "/",
    authMiddleware(["admin", "accounts", "staff"]),
    createLeaveRequest
);

router.get(
    "/my-requests",
    authMiddleware(["admin", "accounts", "staff"]),
    getMyLeaveRequests
);

router.get(
    "/balance",
    authMiddleware(["admin", "accounts", "staff"]),
    getLeaveBalance
);

router.post(
    "/preview",
    authMiddleware(["admin", "accounts", "staff"]),
    previewLeaveDecision
);

router.get(
    "/",
    authMiddleware(["admin", "accounts", "staff"]),
    getLeaveRequests
);

router.get(
    "/user/:cognitoId/balance",
    authMiddleware(["admin"]),
    getUserLeaveBalance
);

router.get(
    "/user/:cognitoId",
    authMiddleware(["admin"]),
    getUserLeaveData
);

router.post("/approve", authMiddleware(["admin"]), approveLeave);

router.post("/reject", authMiddleware(["admin"]), rejectLeave);

export default router;