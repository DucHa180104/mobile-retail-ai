import express from "express";
import { getMyChatHistory, sendChatReply } from "../controllers/chatController.js";
import { protect, protectOptional } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/history", protect, getMyChatHistory);
router.post("/", protectOptional, sendChatReply);

export default router;
