import express from "express";
import { getAdmin, updateAdmin, createAdmin } from "../controllers/adminControllers";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/:cognitoId", authMiddleware(["admin"]), getAdmin);
router.put("/:cognitoId", authMiddleware(["admin"]), updateAdmin);
router.post("/", authMiddleware(["admin"]), createAdmin);

export default router;