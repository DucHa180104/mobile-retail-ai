import mongoose from "mongoose";

const productEmbeddingSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      unique: true
    },
    searchText: {
      type: String,
      required: true
    },
    embedding: {
      type: [Number],
      required: true
    },
    embeddingModel: {
      type: String,
      default: "gemini-embedding-001"
    }
  },
  {
    timestamps: true
  }
);

const ProductEmbedding = mongoose.model("ProductEmbedding", productEmbeddingSchema);

export default ProductEmbedding;
