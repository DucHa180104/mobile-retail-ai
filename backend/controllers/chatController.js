import ChatHistory from "../models/ChatHistory.js";
import { generateChatReply } from "../services/aiChatService.js";

const CHAT_HISTORY_MESSAGE_LIMIT = 100;

export async function sendChatReply(req, res) {
  try {
    const {
      message = "",
      history = [],
      currentProductId = "",
      currentPath = ""
    } = req.body;

    if (!String(message).trim()) {
      return res.status(400).json({
        message: "Vui long nhap noi dung cau hoi"
      });
    }

    const normalizedMessage = String(message).trim();

    const result = await generateChatReply({
      message,
      history,
      currentProductId,
      currentPath
    });

    if (req.user?._id) {
      await saveUserChatHistory({
        userId: req.user._id,
        userMessage: normalizedMessage,
        botReply: result.reply,
        suggestedProducts: result.suggestedProducts || [],
        currentPath,
        currentProductId
      });
    }

    return res.status(200).json({
      reply: result.reply,
      suggestedProducts: result.suggestedProducts || []
    });
  } catch (error) {
    console.error("⚠️ Lỗi xử lý Chatbot:", error.message);
    const friendlyResponse = mapChatbotError(error);

    return res.status(200).json({
      reply: friendlyResponse.reply,
      suggestedProducts: friendlyResponse.suggestedProducts
    });
  }
}

export async function getMyChatHistory(req, res, next) {
  try {
    const history = await ChatHistory.findOne({ user: req.user._id });

    return res.status(200).json({
      messages: formatStoredMessages(history?.messages || [])
    });
  } catch (error) {
    return next(error);
  }
}

function mapChatbotError(error) {
  const rawErrorMessage = String(error?.message || "");
  const normalizedMessage = rawErrorMessage.toLowerCase();

  // 1. Lỗi chạm giới hạn lượt gọi (Rate Limit 429 Quota Exceeded)
  if (
    normalizedMessage.includes("quota") ||
    normalizedMessage.includes("rate limit") ||
    normalizedMessage.includes("429") ||
    normalizedMessage.includes("exceeded")
  ) {
    const retryMatch = rawErrorMessage.match(/retry in (\d+(?:\.\d+)?)\s*s/i);
    const retrySeconds = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) : 10;

    return {
      reply: `⚠️ **[AI tạm thời bận]**: Bạn vừa gửi liên tục câu hỏi nên hệ thống đã chạm giới hạn 20 lượt/phút của gói Google AI miễn phí.\n\n👉 **Cách khắc phục**: Vui lòng đợi khoảng **${retrySeconds} giây** rồi thử bấm gửi lại nhé! 😊`,
      suggestedProducts: []
    };
  }

  // 2. Lỗi bị từ chối quyền truy cập (Permission Denied / Invalid API Key 403 / 401)
  if (
    normalizedMessage.includes("denied access") ||
    normalizedMessage.includes("permission_denied") ||
    normalizedMessage.includes("api key") ||
    normalizedMessage.includes("unauthorized")
  ) {
    return {
      reply: `⚠️ **[Lỗi cấu hình API Key]**: Khóa Google Gemini API Key trong file \`backend/.env\` bị Google từ chối truy cập hoặc chưa hợp lệ.\n\n👉 **Cách khắc phục**: Vui lòng tạo mã API Key mới tại trang [Google AI Studio](https://aistudio.google.com/app/apikey) và dán lại vào dòng \`GEMINI_API_KEY=\` trong file \`backend/.env\` nhé!`,
      suggestedProducts: []
    };
  }

  // 3. Lỗi kết nối mạng (Timeout / Fetch failed)
  if (
    normalizedMessage.includes("timed out") ||
    normalizedMessage.includes("fetch failed") ||
    normalizedMessage.includes("network")
  ) {
    return {
      reply: `⚠️ **[Lỗi kết nối mạng]**: Máy chủ không thể kết nối tới Google AI API lúc này.\n\n👉 **Cách khắc phục**: Vui lòng kiểm tra lại đường truyền Internet của bạn và thử lại nhé!`,
      suggestedProducts: []
    };
  }

  // 4. Các lỗi hệ thống khác
  return {
    reply: `⚠️ **[Lỗi hệ thống Chatbot]**: Hệ thống gặp sự cố: \`${rawErrorMessage || "Lỗi không xác định"}\`.\n\n👉 Vui lòng thử lại sau ít phút nhé!`,
    suggestedProducts: []
  };
}

async function saveUserChatHistory({
  userId,
  userMessage,
  botReply,
  suggestedProducts,
  currentPath,
  currentProductId
}) {
  const history = await ChatHistory.findOne({ user: userId });

  const nextMessages = [
    ...(history?.messages || []),
    {
      role: "user",
      text: userMessage,
      currentPath,
      currentProductId
    },
    {
      role: "bot",
      text: botReply,
      products: normalizeSuggestedProducts(suggestedProducts),
      currentPath,
      currentProductId
    }
  ].slice(-CHAT_HISTORY_MESSAGE_LIMIT);

  await ChatHistory.findOneAndUpdate(
    { user: userId },
    {
      user: userId,
      messages: nextMessages
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    }
  );
}

function normalizeSuggestedProducts(products) {
  if (!Array.isArray(products)) {
    return [];
  }

  return products.map((product) => ({
    id: product.id || "",
    name: product.name || "",
    image: product.image || "",
    priceText: product.priceText || "",
    conditionLabel: product.conditionLabel || "",
    stock: Number(product.stock) || 0,
    stockText: product.stockText || "",
    storage: product.storage || "",
    batteryHealth: product.batteryHealth || "",
    path: product.path || ""
  }));
}

function formatStoredMessages(messages) {
  return messages.map((message) => ({
    id: message._id,
    role: message.role,
    text: message.text,
    products: Array.isArray(message.products) ? message.products : [],
    currentPath: message.currentPath || "",
    currentProductId: message.currentProductId || "",
    createdAt: message.createdAt
  }));
}
