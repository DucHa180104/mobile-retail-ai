import express from "express";
import {
  createTradeInPricingRule,
  deleteTradeInPricingRule,
  getTradeInPricingRuleById,
  getTradeInPricingRules,
  updateTradeInPricingRule
} from "../controllers/tradeInAdminController.js";
import { protect, protectAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, protectAdmin, getTradeInPricingRules);
router.get("/:id", protect, protectAdmin, getTradeInPricingRuleById);
router.post("/", protect, protectAdmin, createTradeInPricingRule);
router.put("/:id", protect, protectAdmin, updateTradeInPricingRule);
router.delete("/:id", protect, protectAdmin, deleteTradeInPricingRule);

export default router;
