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
        message: "Vui lòng nhập nội dung câu hỏi"
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
    const friendlyError = mapChatbotError(error);

    return res.status(friendlyError.status).json({
      message: friendlyError.message
    });
  }
}

export async function getMyChatHistory(req, res) {
  try {
    const history = await ChatHistory.findOne({ user: req.user._id });

    return res.status(200).json({
      messages: formatStoredMessages(history?.messages || [])
    });
  } catch (error) {
    return res.status(500).json({
      message: "Khong the tai lich su chat"
    });
  }
}

function mapChatbotError(error) {
  const errorMessage = String(error?.message || "");
  const normalizedMessage = errorMessage.toLowerCase();

  if (normalizedMessage.includes("quota")) {
    return {
      status: 503,
      message:
        "AI đang quá tải hoặc đã chạm giới hạn lượt gọi. Bạn thử lại sau ít phút nhé."
    };
  }

  if (normalizedMessage.includes("timed out") || normalizedMessage.includes("fetch failed")) {
    return {
      status: 503,
      message: "Không thể kết nối tới Gemini API lúc này. Bạn kiểm tra mạng rồi thử lại nhé."
    };
  }

  if (
    normalizedMessage.includes("api key") ||
    normalizedMessage.includes("gemini_api_key") ||
    normalizedMessage.includes("unauthorized")
  ) {
    return {
      status: 500,
      message: "Cấu hình Gemini API chưa hợp lệ. Bạn kiểm tra lại API key trong file .env."
    };
  }

  return {
    status: 500,
    message: errorMessage || "Chatbot đang gặp lỗi tạm thời. Bạn thử lại sau nhé."
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
