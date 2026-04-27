import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

console.log("MONGODB_URI:", process.env.MONGODB_URI);

const app = express();

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Connected MongoDB"))
  .catch((err) => console.log("❌ Error:", err.message));

app.get("/", (req, res) => {
  res.send("Hello backend 🚀");
});

app.listen(5000, () => {
  console.log("🚀 Server running on port 5000");
});