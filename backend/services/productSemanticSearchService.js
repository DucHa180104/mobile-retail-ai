import ProductEmbedding from "../models/ProductEmbedding.js";
import { generateEmbedding } from "./embeddingService.js";

/**
 * Perform hybrid semantic search on products.
 * Combines structured MongoDB pre-filtering with vector similarity comparison in memory.
 * @param {object} params Parameter payload containing user query and extracted filters.
 * @param {string} params.message The user's query string.
 * @param {object} params.filters Extracted structured filters (brand, maxPrice, needsGaming, etc.).
 * @returns {Promise<object[]>} Array of matching Product objects from the database.
 */
export async function searchSemanticProducts({ message, filters = {} }) {
  const queryText = String(message || "").trim();
  if (!queryText) {
    return [];
  }

  // 1. Get query embedding
  let queryVector;
  try {
    queryVector = await generateEmbedding(queryText);
  } catch (err) {
    console.error("Lỗi tạo vector cho câu hỏi của khách:", err.message);
    throw err; // Throw to let caller trigger fallback
  }

  // 2. Fetch all embeddings populated with product info
  const embeddings = await ProductEmbedding.find()
    .populate("product")
    .lean();

  if (!embeddings.length) {
    return [];
  }

  // 3. Pre-filter candidate products based on hard structured constraints
  let candidates = embeddings
    .filter((emb) => emb.product && Number(emb.product.stock || 0) > 0) // Only in-stock
    .map((emb) => ({
      product: emb.product,
      vector: emb.embedding,
      searchText: emb.searchText
    }));

  // Filter by Brand (if user specified a particular brand)
  if (filters.brand) {
    const brandLower = String(filters.brand).toLowerCase().trim();
    candidates = candidates.filter(
      (c) => String(c.product.brand || "").toLowerCase().trim() === brandLower
    );
  }

  // Filter by Category
  if (filters.category) {
    const categoryLower = String(filters.category).toLowerCase().trim();
    candidates = candidates.filter(
      (c) => String(c.product.category || "").toLowerCase().trim() === categoryLower
    );
  }

  // Filter by Price range
  if (filters.maxPrice) {
    candidates = candidates.filter((c) => Number(c.product.price || 0) <= filters.maxPrice);
  }
  if (filters.minPrice) {
    candidates = candidates.filter((c) => Number(c.product.price || 0) >= filters.minPrice);
  }

  // Filter by Condition
  if (filters.condition) {
    candidates = candidates.filter((c) => c.product.condition === filters.condition);
  }

  if (!candidates.length) {
    return [];
  }

  // 4. Calculate similarity scores and sort in memory
  const scoredCandidates = candidates.map((c) => {
    const similarity = calculateCosineSimilarity(queryVector, c.vector);
    
    // Apply a light rerank boost based on stock and price
    let finalScore = similarity;
    
    // Slight priority boost for popular brands or low-stock items (rerank nudge)
    if (filters.needsGaming && String(c.product.specs?.chip || "").toLowerCase().match(/(bionic|snapdragon 8|pro|max)/)) {
      finalScore += 0.05;
    }
    
    return {
      product: c.product,
      score: finalScore
    };
  });

  // Sort descending by score
  scoredCandidates.sort((a, b) => b.score - a.score);

  // Return the raw Product documents, limited to top 6 candidates
  return scoredCandidates.slice(0, 6).map((c) => c.product);
}

/**
 * Calculates cosine similarity between two vectors.
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
