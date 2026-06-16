import express from "express";
import { getCurrencies } from "../controllers/currencyController";

const router = express.Router();

router.get("/", getCurrencies);

export default router;