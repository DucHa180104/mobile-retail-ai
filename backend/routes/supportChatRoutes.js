import express from "express";
import {
  getAdminSupportConversationMessages,
  getAdminSupportConversations,
  getMySupportConversation,
  sendAdminSupportReply,
  sendMySupportMessage
} from "../controllers/supportChatController.js";
import { protect, protectAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/me", protect, getMySupportConversation);
router.post("/me/messages", protect, sendMySupportMessage);

router.get("/admin/conversations", protect, protectAdmin, getAdminSupportConversations);
router.get(
  "/admin/conversations/:conversationId/messages",
  protect,
  protectAdmin,
  getAdminSupportConversationMessages
);
router.post(
  "/admin/conversations/:conversationId/messages",
  protect,
  protectAdmin,
  sendAdminSupportReply
);

export default router;
