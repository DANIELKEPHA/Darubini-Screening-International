import express from "express";
import { getAdmin, updateAdmin, createAdmin } from "../controllers/adminControllers";
import { authMiddleware } from "../middleware/authMiddleware";
import {upload} from "../middleware/upload";

const router = express.Router();

// GET - No file upload needed
router.get("/:cognitoId", authMiddleware(["admin"]), getAdmin);

router.post(
    "/",
    authMiddleware(["admin"]),
    upload.single("profilePicture"),
    createAdmin
);

router.put(
    "/:cognitoId",
    authMiddleware(["admin"]),
    upload.single("profilePicture"),
    updateAdmin
);

export default router;