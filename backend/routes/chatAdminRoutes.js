import express from "express";
import { getAdminChatLogs } from "../controllers/chatAdminController.js";
import { protect, protectAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, protectAdmin, getAdminChatLogs);

export default router;
