// CHATBOT: controller bước 2
// TODO: bước sau service sẽ gọi Gemini API thật.
import { generateChatReply } from "../services/aiChatService.js";

export async function sendChatReply(req, res) {
  try {
    const { message = "" } = req.body;

    if (!String(message).trim()) {
      return res.status(400).json({
        message: "Vui lòng nhập nội dung câu hỏi"
      });
    }

    // CHATBOT: controller gọi service để lấy reply
    const reply = await generateChatReply(message);

    return res.status(200).json({
      reply
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Chatbot AI mock đang gặp lỗi"
    });
  }
}
