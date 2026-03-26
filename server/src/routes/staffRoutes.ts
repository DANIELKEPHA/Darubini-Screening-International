import express from "express";
import { getStaff, createStaff, updateStaff } from "../controllers/staffControllers";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/:cognitoId", authMiddleware(["admin", "staff"]), getStaff);
router.post("/", authMiddleware(["admin", "staff"]), createStaff);
router.put("/:cognitoId", authMiddleware(["admin", "staff"]), updateStaff);

export default router;