import mongoose from "mongoose";

const adminNotificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["order_created", "support_message"],
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    targetUrl: {
      type: String,
      required: true,
      trim: true
    },
    isRead: {
      type: Boolean,
      default: false
    },
    readAt: {
      type: Date,
      default: null
    },
    metadata: {
      orderId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
      },
      conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
      },
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
      }
    }
  },
  {
    timestamps: true
  }
);

adminNotificationSchema.index({ isRead: 1, createdAt: -1 });

const AdminNotification = mongoose.model(
  "AdminNotification",
  adminNotificationSchema
);

export default AdminNotification;
