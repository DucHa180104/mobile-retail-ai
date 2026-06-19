import mongoose from "mongoose";

const suggestedProductSchema = new mongoose.Schema(
  {
    id: { type: String, default: "" },
    name: { type: String, default: "" },
    image: { type: String, default: "" },
    priceText: { type: String, default: "" },
    conditionLabel: { type: String, default: "" },
    stock: { type: Number, default: 0 },
    stockText: { type: String, default: "" },
    storage: { type: String, default: "" },
    batteryHealth: { type: String, default: "" },
    path: { type: String, default: "" }
  },
  {
    _id: false
  }
);

const chatMessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "bot"],
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true
    },
    products: [suggestedProductSchema],
    currentPath: {
      type: String,
      default: ""
    },
    currentProductId: {
      type: String,
      default: ""
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    _id: true
  }
);

const chatHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    messages: [chatMessageSchema]
  },
  {
    timestamps: true
  }
);

const ChatHistory = mongoose.model("ChatHistory", chatHistorySchema);

export default ChatHistory;
