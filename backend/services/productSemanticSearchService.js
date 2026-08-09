import Product from "../models/Product.js";
import ProductEmbedding from "../models/ProductEmbedding.js";
import { generateEmbedding } from "./embeddingService.js";

/**
 * Thực hiện tìm kiếm ngữ nghĩa kết hợp (Hybrid Semantic Search) trên danh sách sản phẩm.
 * Kết hợp giữa Tiền lọc điều kiện cứng trong MongoDB với So sánh độ tương đồng Vector trong bộ nhớ RAM.
 * @param {object} params Đối tượng tham số chứa câu hỏi người dùng và bộ lọc bóc tách.
 * @param {string} params.message Chuỗi câu hỏi của khách hàng.
 * @param {object} params.filters Các bộ lọc điều kiện bóc tách (hãng, giá tối đa, nhu cầu chơi game...).
 * @returns {Promise<object[]>} Mảng danh sách các sản phẩm phù hợp lấy từ Database.
 */
let cachedEmbeddings = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 3 * 60 * 1000; // Cache 3 phút trong bộ nhớ RAM

async function getCachedEmbeddings() {
  const now = Date.now();
  if (cachedEmbeddings && (now - lastCacheTime < CACHE_TTL_MS)) {
    return cachedEmbeddings;
  }

  const embeddings = await ProductEmbedding.find().populate("product").lean();

  // Do not cache an empty result. Embeddings may be generated immediately
  // afterwards, and the chatbot should see them on the next request.
  if (Array.isArray(embeddings) && embeddings.length > 0) {
    cachedEmbeddings = embeddings;
    lastCacheTime = now;
  } else {
    cachedEmbeddings = null;
    lastCacheTime = 0;
  }

  return embeddings;
}

export async function searchSemanticProducts({ message, filters = {} }) {
  const queryText = String(message || "").trim();
  if (!queryText) {
    return [];
  }

  // Bỏ qua Vector Search với câu chào xã giao đơn giản để tăng tốc độ phản hồi tối đa
  const cleanMsg = queryText.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const isPureGreeting = ["xin chao", "chao shop", "hi", "hello", "shop oi"].includes(cleanMsg);
  if (isPureGreeting) {
    return [];
  }

  // 1. Chuyển câu hỏi của khách thành vector 768 chiều
  let queryVector;
  try {
    queryVector = await generateEmbedding(queryText);
  } catch (err) {
    console.error("Lỗi tạo vector cho câu hỏi của khách:", err.message);
    throw err;
  }

  // 2. Lấy danh sách vector từ RAM Cache (Không tốn 1.5s gọi lại MongoDB Atlas)
  const embeddings = await getCachedEmbeddings();

  if (!embeddings || !embeddings.length) {
    return [];
  }

  // 3. Tiền lọc các ứng viên sản phẩm dựa trên các điều kiện cứng
  let candidates = embeddings
    .filter((emb) => emb.product && Number(emb.product.stock || 0) > 0) // Chỉ lấy sản phẩm còn hàng
    .map((emb) => ({
      product: emb.product,
      vector: emb.embedding,
      searchText: emb.searchText
    }));

  // Lọc theo Hãng sản xuất (nếu người dùng chỉ định rõ hãng)
  if (filters.brand) {
    const brandLower = String(filters.brand).toLowerCase().trim();
    candidates = candidates.filter(
      (c) => String(c.product.brand || "").toLowerCase().trim() === brandLower
    );
  }

  // Lọc theo Danh mục
  if (filters.category) {
    const categoryLower = String(filters.category).toLowerCase().trim();
    candidates = candidates.filter(
      (c) => String(c.product.category || "").toLowerCase().trim() === categoryLower
    );
  }

  // Lọc theo Khoảng giá
  if (filters.maxPrice) {
    candidates = candidates.filter((c) => Number(c.product.price || 0) <= filters.maxPrice);
  }
  if (filters.minPrice) {
    candidates = candidates.filter((c) => Number(c.product.price || 0) >= filters.minPrice);
  }

  // Lọc theo Tình trạng máy (Mới, Cũ 99%, Cũ đẹp...)
  if (filters.condition) {
    candidates = candidates.filter((c) => c.product.condition === filters.condition);
  }

  if (!candidates.length) {
    return [];
  }

  // 4. Tính toán điểm số tương đồng Cosine và sắp xếp trong bộ nhớ RAM
  const scoredCandidates = candidates.map((c) => {
    const similarity = calculateCosineSimilarity(queryVector, c.vector);
    
    // Áp dụng cơ chế cộng điểm ưu tiên nhẹ (Rerank)
    let finalScore = similarity;
    
    // Ưu tiên cộng thêm 0.05 điểm cho máy có chip khủng nếu khách có nhu cầu chơi game
    if (filters.needsGaming && String(c.product.specs?.chip || "").toLowerCase().match(/(bionic|snapdragon 8|pro|max)/)) {
      finalScore += 0.05;
    }
    
    return {
      product: c.product,
      score: finalScore
    };
  });

  // Sắp xếp danh sách điểm giảm dần (điểm cao nhất lên đầu)
  scoredCandidates.sort((a, b) => b.score - a.score);

  // Trả về danh sách Top 6 sản phẩm phù hợp nhất
  return scoredCandidates.slice(0, 6).map((c) => c.product);
}

/**
 * Tính toán độ tương đồng Cosine Similarity giữa 2 mảng vector.
 */
function calculateCosineSimilarity(vecA, vecB) {
  if (!Array.isArray(vecA) || !Array.isArray(vecB) || vecA.length !== vecB.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
