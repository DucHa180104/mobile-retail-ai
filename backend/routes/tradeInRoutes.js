import express from "express";
import {
  estimateTradeIn,
  getActiveTradeInPricingRules
} from "../controllers/tradeInController.js";

const router = express.Router();

router.get("/pricing-rules", getActiveTradeInPricingRules);
router.post("/estimate", estimateTradeIn);

export default router;
