// CHATBOT: controller mock cho bước 1
// TODO: bước sau sẽ gọi AI API thật thay vì trả lời giả lập.

export async function sendChatReply(req, res) {
  try {
    const { message = "" } = req.body;

    if (!String(message).trim()) {
      return res.status(400).json({
        message: "Vui lòng nhập nội dung câu hỏi"
      });
    }

    // CHATBOT: mock response để kiểm tra luồng frontend -> backend -> frontend
    return res.status(200).json({
      reply: `Bạn vừa hỏi: ${String(message).trim()}`
    });
  } catch (error) {
    return res.status(500).json({
      message: "Chatbot mock đang gặp lỗi"
    });
  }
}
