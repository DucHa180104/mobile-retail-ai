import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import { createCorsOptions, parseAllowedOrigins } from "./config/corsOptions.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import tradeInRoutes from "./routes/tradeInRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import userAdminRoutes from "./routes/userAdminRoutes.js";
import chatAdminRoutes from "./routes/chatAdminRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import contactSettingsRoutes from "./routes/contactSettingsRoutes.js";
import supportChatRoutes from "./routes/supportChatRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const uploadsPath = path.join(__dirname, "uploads");
const allowedOrigins = parseAllowedOrigins(process.env.ALLOWED_ORIGINS);

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

app.use(cors(createCorsOptions(allowedOrigins)));
app.use(express.json());
app.use("/uploads", express.static(uploadsPath));

app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/tradein", tradeInRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/admin/users", userAdminRoutes);
app.use("/api/admin/chat-logs", chatAdminRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/contact-settings", contactSettingsRoutes);
app.use("/api/support-chat", supportChatRoutes);
app.use(errorHandler);

app.get("/", (req, res) => {
  res.send("Hello backend");
});

async function startServer() {
  try {
    if (!MONGODB_URI) {
      throw new Error("MONGODB_URI is missing in .env");
    }

    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000
    });
    console.log("MongoDB Connected");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
}

startServer();
