import express from "express";
import {getAdmin, updateAdmin, createAdmin, getAllUsers} from "../controllers/adminControllers";
import { authMiddleware } from "../middleware/authMiddleware";
import {upload} from "../middleware/upload";

const router = express.Router();

router.get("/all-users", authMiddleware(["admin"]), getAllUsers);

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