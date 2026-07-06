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
  const errorMessage = String(error?.message || "");
  const normalizedMessage = errorMessage.toLowerCase();

  if (normalizedMessage.includes("quota")) {
    return {
      status: 503,
      message: "AI dang qua tai hoac da cham gioi han luot goi. Ban thu lai sau it phut nhe."
    };
  }

  if (
    normalizedMessage.includes("timed out") ||
    normalizedMessage.includes("fetch failed")
  ) {
    return {
      status: 503,
      message: "Khong the ket noi toi Gemini API luc nay. Ban kiem tra mang roi thu lai nhe."
    };
  }

  if (
    normalizedMessage.includes("api key") ||
    normalizedMessage.includes("gemini_api_key") ||
    normalizedMessage.includes("unauthorized")
  ) {
    return {
      status: 500,
      message: "Cau hinh Gemini API chua hop le. Ban kiem tra lai API key trong file .env."
    };
  }

  return {
    status: 500,
    message: "Chatbot dang gap loi tam thoi. Ban thu lai sau nhe."
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
