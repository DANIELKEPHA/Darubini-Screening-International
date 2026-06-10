import express from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import {
    createOrUpdateLeavePolicies,
    initializeLeaveBalances,
    getLeavePoliciesByYear,
    getLeavePolicy,
    updateLeavePolicy,
    deleteLeavePolicy,
} from "../controllers/leavePolicies";

const router = express.Router();

/**
 * CREATE / BULK UPSERT
 */
router.post(
    "/",
    authMiddleware(["admin"]),
    createOrUpdateLeavePolicies
);

router.post(
    "/initialize-balances",
    authMiddleware(["admin"]),
    initializeLeaveBalances
);

router.get(
    "/:year",
    authMiddleware(["admin", "accounts", "staff"]),
    getLeavePoliciesByYear
);

router.get(
    "/:year/:role",
    authMiddleware(["admin", "accounts", "staff"]),
    getLeavePolicy
);

router.patch(
    "/:year/:role",
    authMiddleware(["admin"]),
    updateLeavePolicy
);

router.delete(
    "/:year/:role",
    authMiddleware(["admin"]),
    deleteLeavePolicy
);

export default router;