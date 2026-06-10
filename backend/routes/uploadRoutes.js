import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { protect, protectAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsPath = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadsPath);
  },
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const baseName = path
      .basename(file.originalname, extension)
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .slice(0, 40);

    callback(null, `${Date.now()}-${baseName || "product-image"}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (_req, file, callback) => {
    const allowedExtensions = [".png", ".jpg", ".jpeg", ".webp"];
    const extension = path.extname(file.originalname).toLowerCase();

    if (!allowedExtensions.includes(extension)) {
      callback(new Error("Chỉ cho phép upload ảnh png, jpg, jpeg hoặc webp"));
      return;
    }

    callback(null, true);
  }
});

router.post("/", protect, protectAdmin, (req, res) => {
  upload.single("image")(req, res, (error) => {
    if (error) {
      res.status(400).json({ message: error.message || "Upload ảnh thất bại" });
      return;
    }

    if (!req.file) {
      res.status(400).json({ message: "Vui lòng chọn một file ảnh" });
      return;
    }

    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

    res.status(201).json({
      message: "Upload ảnh thành công",
      imageUrl
    });
  });
});

export default router;
