import ChatHistory from "../models/ChatHistory.js";

export async function getAdminChatLogs(req, res) {
  try {
    const histories = await ChatHistory.find()
      .populate("user", "name email role")
      .sort({ updatedAt: -1 });

    const logs = histories.map((history) => {
      const lastMessage = history.messages[history.messages.length - 1] || null;
      const lastUserMessage = [...history.messages]
        .reverse()
        .find((message) => message.role === "user");

      return {
        id: history._id,
        user: history.user
          ? {
              id: history.user._id,
              name: history.user.name,
              email: history.user.email,
              role: history.user.role
            }
          : null,
        totalMessages: history.messages.length,
        updatedAt: history.updatedAt,
        lastMessage,
        lastUserMessage: lastUserMessage || null,
        messages: history.messages.map((message) => ({
          id: message._id,
          role: message.role,
          text: message.text,
          products: Array.isArray(message.products) ? message.products : [],
          currentPath: message.currentPath || "",
          currentProductId: message.currentProductId || "",
          createdAt: message.createdAt
        }))
      };
    });

    return res.status(200).json({
      logs
    });
  } catch (error) {
    return res.status(500).json({
      message: "Khong the tai log chatbot"
    });
  }
}
