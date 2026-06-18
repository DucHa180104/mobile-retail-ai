// CHATBOT AI: service riêng để gọi Gemini và trả câu trả lời về controller.
export async function generateChatReply(message) {
  const trimmedMessage = String(message || "").trim();

  if (!trimmedMessage) {
    throw new Error("Nội dung câu hỏi không được để trống");
  }

  // Đọc API key từ biến môi trường trong file .env
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!geminiApiKey) {
    throw new Error("Thiếu GEMINI_API_KEY trong file .env");
  }

  // Tạo endpoint Gemini cho model đang dùng
  const modelName = "gemini-1.5-flash";
  const endpoint =
    `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent` +
    `?key=${geminiApiKey}`;

  // Tạo body gửi lên Gemini từ câu hỏi của người dùng
  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: trimmedMessage
          }
        ]
      }
    ]
  };

  let response;
  let data;

  try {
    // Gọi Gemini API bằng fetch có sẵn trong Node.js
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    data = await response.json();
  } catch {
    throw new Error("Không thể kết nối tới Gemini API");
  }

  if (!response.ok) {
    const geminiErrorMessage =
      data?.error?.message || "Gemini API trả về lỗi không xác định";

    throw new Error(`Gemini API lỗi: ${geminiErrorMessage}`);
  }

  // Lấy text trả lời từ response Gemini
  const reply =
    data?.candidates?.[0]?.content?.parts
      ?.map((part) => part?.text || "")
      .join("")
      .trim() || "";

  if (!reply) {
    throw new Error("Gemini không trả về nội dung phản hồi");
  }

  return reply;
}
