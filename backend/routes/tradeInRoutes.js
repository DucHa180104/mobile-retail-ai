import express from "express";
import { estimateTradeIn } from "../controllers/tradeInController.js";

const router = express.Router();

router.post("/estimate", estimateTradeIn);

export default router;
