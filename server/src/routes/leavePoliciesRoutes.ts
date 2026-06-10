import express from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import {
    createOrUpdateLeavePolicies,
    initializeLeaveBalances
} from "../controllers/leavePolicies";

const router = express.Router();

router.post("/", authMiddleware(["admin"]), createOrUpdateLeavePolicies);

router.post("/initialize-balances", authMiddleware(["admin"]), initializeLeaveBalances);

export default router;