import dotenv from "dotenv";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import ProductEmbedding from "../models/ProductEmbedding.js";
import { generateEmbedding } from "../services/embeddingService.js";

// Load environment variables
dotenv.config();

function getConditionLabel(condition) {
  if (condition === "used_99") return "Cũ 99%";
  if (condition === "used_good") return "Cũ đẹp";
  if (condition === "used_fair") return "Cũ dùng tốt";
  return "Máy mới";
}

function buildSearchText(p) {
  const parts = [
    `Tên: ${p.name || ""}`,
    `Hãng: ${p.brand || ""}`,
    `Danh mục: ${p.category || ""}`,
    `Giá: ${Number(p.price || 0).toLocaleString("vi-VN")} đ`,
    `Tình trạng: ${getConditionLabel(p.condition)}`,
    `Màu sắc: ${p.usedDetails?.color || "Chưa rõ"}`,
    `Dung lượng: ${p.specs?.storage || "Chưa rõ"}`,
    `Pin: ${p.usedDetails?.batteryHealth || p.specs?.battery || "Chưa rõ"}`,
    `Màn hình: ${p.specs?.screen || p.usedDetails?.screenStatus || "Chưa rõ"}`,
    `Camera: ${p.specs?.camera || "Chưa rõ"}`,
    `Face ID / Touch ID: ${p.usedDetails?.faceIdStatus || "Chưa rõ"}`,
    `Bảo hành: ${p.usedDetails?.warranty || "Chưa rõ"}`,
    `Lịch sử sửa chữa: ${p.usedDetails?.repairHistory || "Chưa rõ"}`,
    `Ghi chú: ${p.usedDetails?.note || p.description || "Không có"}`
  ];
  return parts.join(". ").replace(/\s+/g, " ");
}

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ Thiếu MONGODB_URI trong biến môi trường (.env)");
    process.exit(1);
  }

  console.log("🔌 Kết nối cơ sở dữ liệu MongoDB...");
  await mongoose.connect(uri);
  console.log("✅ Kết nối thành công!");

  try {
    const products = await Product.find({});
    console.log(`📦 Tìm thấy ${products.length} sản phẩm cần xử lý.`);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      const searchText = buildSearchText(p);

      console.log(`[${i + 1}/${products.length}] Tạo vector cho sản phẩm: "${p.name}"`);

      try {
        // Call Gemini embedding API
        const embedding = await generateEmbedding(searchText);

        // Update or insert vector embedding
        await ProductEmbedding.findOneAndUpdate(
          { product: p._id },
          {
            searchText,
            embedding,
            embeddingModel: "gemini-embedding-001"
          },
          { upsert: true, new: true }
        );

        successCount++;
        // Short pause to respect API rate limits
        await new Promise((resolve) => setTimeout(resolve, 300));
      } catch (err) {
        console.error(`❌ Thất bại khi tạo vector cho "${p.name}":`, err.message);
        failCount++;
      }
    }

    console.log("\n=================================");
    console.log("🚀 HOÀN TẤT BUILD EMBEDDINGS!");
    console.log(`- Thành công: ${successCount}/${products.length}`);
    console.log(`- Thất bại: ${failCount}/${products.length}`);
    console.log("=================================");
  } catch (error) {
    console.error("❌ Lỗi xảy ra khi chạy script:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Đã ngắt kết nối database.");
  }
}

run();
