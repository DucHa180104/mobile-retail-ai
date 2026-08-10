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
    const friendlyError = mapChatbotError(error);

    return res.status(friendlyError.status).json({
      message: friendlyError.message
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
    return {
      status: 503,
      message: "AI đang bận hoặc đã đạt giới hạn lượt gọi. Bạn vui lòng thử lại sau ít phút."
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
      status: 503,
      message: "Dịch vụ AI hiện chưa sẵn sàng. Bạn vui lòng thử lại sau."
    };
  }

  // 3. Lỗi kết nối mạng (Timeout / Fetch failed)
  if (
    normalizedMessage.includes("timed out") ||
    normalizedMessage.includes("fetch failed") ||
    normalizedMessage.includes("network")
  ) {
    return {
      status: 503,
      message: "Không thể kết nối tới dịch vụ AI lúc này. Bạn vui lòng thử lại sau."
    };
  }

  // 4. Các lỗi hệ thống khác
  return {
    status: 500,
    message: "Chatbot đang gặp lỗi tạm thời. Bạn vui lòng thử lại sau."
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
