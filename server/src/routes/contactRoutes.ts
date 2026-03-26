import express from "express";
import {
    createContact,
    getContacts,
    getContact,
    deleteContact,
} from "../controllers/contactControllers";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

// Public route for creating contact submissions
router.post("/", createContact);

// Protected routes for admins/managers to view and delete contacts
router.get("/", authMiddleware(["admin"]), getContacts);
router.get("/:id", authMiddleware(["admin"]), getContact);
router.delete("/:id", authMiddleware(["admin"]), deleteContact);

export default router;