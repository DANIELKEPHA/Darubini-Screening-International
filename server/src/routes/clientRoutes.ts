import express from "express";
import {
    createClient,
    getClients,
    getClient,
    updateClient,
    deleteClient,
    importClientsFromCSV,
} from "../controllers/ClientController";
import { authMiddleware } from "../middleware/authMiddleware";
import { upload } from "../middleware/upload";

const router = express.Router();

// === Single Client Operations ===
router.post(
    "/",
    authMiddleware(["admin", "accounts", "staff"]),
    upload.single("image"),
    createClient
);

router.get(
    "/",
    authMiddleware(["admin", "accounts", "staff"]),
    getClients
);

router.get(
    "/:id",
    authMiddleware(["admin", "accounts", "staff"]),
    getClient
);

router.patch(
    "/:id",
    authMiddleware(["admin", "accounts", "staff"]),
    upload.single("image"),
    updateClient
);

router.delete(
    "/:id",
    authMiddleware(["admin", "accounts", "staff"]),
    deleteClient
);

router.post(
    "/import-csv",
    authMiddleware(["admin", "accounts", "staff"]),
    upload.single("file"),
    importClientsFromCSV
);

export default router;