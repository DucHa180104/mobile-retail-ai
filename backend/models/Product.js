import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    brand: {
      type: String,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    stock: {
      type: Number,
      default: 0,
      min: 0
    },
    images: [
      {
        type: String
      }
    ],
    description: {
      type: String,
      trim: true
    },
    specs: {
      screen: { type: String, default: "" },
      chip: { type: String, default: "" },
      ram: { type: String, default: "" },
      storage: { type: String, default: "" },
      battery: { type: String, default: "" },
      camera: { type: String, default: "" }
    }
  },
  {
    timestamps: true
  }
);

const Product = mongoose.model("Product", productSchema);

export default Product;