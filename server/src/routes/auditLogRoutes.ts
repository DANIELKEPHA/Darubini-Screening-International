import express from "express";
import { getAuditLogs } from "../controllers/auditLogControllers";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/", authMiddleware(["accounts", "staff", "admin"]), getAuditLogs);

export default router;