import express from "express";
import { sendChatReply } from "../controllers/chatController.js";

const router = express.Router();

// CHATBOT: route mock bước 1
// TODO: bước sau có thể thêm validate, auth hoặc lưu lịch sử chat nếu cần.
router.post("/", sendChatReply);

export default router;
