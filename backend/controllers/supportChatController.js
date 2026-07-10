import SupportConversation from "../models/SupportConversation.js";
import SupportMessage from "../models/SupportMessage.js";
import { createSupportMessageNotification } from "../services/adminNotificationService.js";

async function findOrCreateConversationForUser(userId) {
  let conversation = await SupportConversation.findOne({ user: userId });

  if (!conversation) {
    conversation = await SupportConversation.create({
      user: userId,
      status: "open"
    });
  }

  return conversation;
}

export const getMySupportConversation = async (req, res, next) => {
  try {
    const conversation = await findOrCreateConversationForUser(req.user._id);

    const messages = await SupportMessage.find({
      conversation: conversation._id
    }).sort({ createdAt: 1 });

    return res.json({
      conversation,
      messages
    });
  } catch (error) {
    return next(error);
  }
};

export const sendMySupportMessage = async (req, res, next) => {
  try {
    const content = req.body.content?.trim();

    if (!content) {
      return res.status(400).json({
        message: "Message content is required"
      });
    }

    const conversation = await findOrCreateConversationForUser(req.user._id);

    const message = await SupportMessage.create({
      conversation: conversation._id,
      sender: req.user._id,
      senderType: "user",
      content,
      isRead: false
    });

    conversation.lastMessage = content;
    conversation.lastMessageAt = message.createdAt;
    conversation.lastSenderType = "user";
    conversation.status = "open";
    await conversation.save();

    try {
      await createSupportMessageNotification({
        conversation,
        user: req.user,
        message
      });
    } catch (notificationError) {
      console.error(
        "Create support message notification error:",
        notificationError.message
      );
    }

    return res.status(201).json({
      conversation,
      message
    });
  } catch (error) {
    return next(error);
  }
};

export const getAdminSupportConversations = async (req, res, next) => {
  try {
    const conversations = await SupportConversation.find()
      .populate("user", "name email phoneNumber shippingInfo")
      .sort({ lastMessageAt: -1, updatedAt: -1 });

    return res.json({
      conversations
    });
  } catch (error) {
    return next(error);
  }
};

export const getAdminSupportConversationMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;

    const conversation = await SupportConversation.findById(conversationId).populate(
      "user",
      "name email phoneNumber shippingInfo"
    );

    if (!conversation) {
      return res.status(404).json({
        message: "Support conversation not found"
      });
    }

    const messages = await SupportMessage.find({
      conversation: conversation._id
    })
      .populate("sender", "name email role")
      .sort({ createdAt: 1 });

    await SupportMessage.updateMany(
      {
        conversation: conversation._id,
        senderType: "user",
        isRead: false
      },
      {
        $set: {
          isRead: true
        }
      }
    );

    return res.json({
      conversation,
      messages
    });
  } catch (error) {
    return next(error);
  }
};

export const sendAdminSupportReply = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const content = req.body.content?.trim();

    if (!content) {
      return res.status(400).json({
        message: "Reply content is required"
      });
    }

    const conversation = await SupportConversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        message: "Support conversation not found"
      });
    }

    const message = await SupportMessage.create({
      conversation: conversation._id,
      sender: req.user._id,
      senderType: "admin",
      content,
      isRead: false
    });

    conversation.lastMessage = content;
    conversation.lastMessageAt = message.createdAt;
    conversation.lastSenderType = "admin";
    conversation.status = "open";
    await conversation.save();

    return res.status(201).json({
      conversation,
      message
    });
  } catch (error) {
    return next(error);
  }
};
