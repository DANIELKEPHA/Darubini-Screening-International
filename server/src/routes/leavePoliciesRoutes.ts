import express from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import {createOrUpdateLeavePolicies} from "../controllers/leavePolicies";

const router = express.Router();

router.post(
    "/",
    authMiddleware(["admin"]),
    createOrUpdateLeavePolicies
);

export default router;