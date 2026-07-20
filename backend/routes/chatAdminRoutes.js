import express from "express";
import { getAdminChatLogs, getAdminDashboardAIAnalysis } from "../controllers/chatAdminController.js";
import { protect, protectAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, protectAdmin, getAdminChatLogs);
router.get("/ai-insights", protect, protectAdmin, getAdminDashboardAIAnalysis);

export default router;
