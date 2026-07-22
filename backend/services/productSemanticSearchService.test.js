import { describe, expect, it, vi, beforeEach } from "vitest";
import { searchSemanticProducts } from "./productSemanticSearchService.js";
import ProductEmbedding from "../models/ProductEmbedding.js";
import { generateEmbedding } from "./embeddingService.js";

// Mock ProductEmbedding model and generateEmbedding service
vi.mock("../models/ProductEmbedding.js", () => {
  return {
    default: {
      find: vi.fn()
    }
  };
});

vi.mock("./embeddingService.js", () => {
  return {
    generateEmbedding: vi.fn()
  };
});

describe("productSemanticSearchService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return empty list if query message is empty", async () => {
    const results = await searchSemanticProducts({ message: "" });
    expect(results).toEqual([]);
  });

  it("should throw error if generateEmbedding fails", async () => {
    generateEmbedding.mockRejectedValue(new Error("API key expired"));
    await expect(searchSemanticProducts({ message: "iPhone" })).rejects.toThrow("API key expired");
  });

  it("should return empty array if DB returns no embeddings", async () => {
    generateEmbedding.mockResolvedValue([1.0, 0.0, 0.0]);
    ProductEmbedding.find.mockReturnValue({
      populate: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([])
      })
    });

    const results = await searchSemanticProducts({ message: "iPhone" });
    expect(results).toEqual([]);
  });

  it("should filter by maxPrice, brand, category and condition correctly", async () => {
    generateEmbedding.mockResolvedValue([1.0, 0.0, 0.0]);

    ProductEmbedding.find.mockReturnValue({
      populate: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          {
            product: { _id: "p1", name: "iPhone 15", stock: 2, price: 20000000, brand: "Apple", category: "phones", condition: "new" },
            embedding: [1.0, 0.0, 0.0]
          },
          {
            product: { _id: "p2", name: "iPhone 12", stock: 3, price: 9000000, brand: "Apple", category: "phones", condition: "used_good" },
            embedding: [0.9, 0.1, 0.0]
          },
          {
            product: { _id: "p3", name: "Samsung S24", stock: 4, price: 18000000, brand: "Samsung", category: "phones", condition: "new" },
            embedding: [0.1, 0.9, 0.0]
          }
        ])
      })
    });

    // Case A: Filter brand and maxPrice
    const resultsPrice = await searchSemanticProducts({
      message: "iPhone",
      filters: { brand: "Apple", maxPrice: 15000000 }
    });
    expect(resultsPrice.length).toBe(1);
    expect(resultsPrice[0].name).toBe("iPhone 12");

    // Case B: Filter condition
    const resultsCondition = await searchSemanticProducts({
      message: "máy mới",
      filters: { condition: "new" }
    });
    expect(resultsCondition.length).toBe(2);
    expect(resultsCondition[0].name).toBe("iPhone 15"); // higher score
    expect(resultsCondition[1].name).toBe("Samsung S24");
  });
});

