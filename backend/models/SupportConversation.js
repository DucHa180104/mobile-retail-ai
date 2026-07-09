import mongoose from "mongoose";

const supportConversationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open"
    },
    lastMessage: {
      type: String,
      trim: true,
      default: ""
    },
    lastMessageAt: {
      type: Date,
      default: null
    },
    lastSenderType: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    }
  },
  {
    timestamps: true
  }
);

const SupportConversation = mongoose.model("SupportConversation", supportConversationSchema);

export default SupportConversation;
