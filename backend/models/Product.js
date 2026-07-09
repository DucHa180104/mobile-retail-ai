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
    category: {
      type: String,
      enum: ["phone", "tablet", "accessory"],
      default: "phone"
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
    condition: {
      type: String,
      enum: ["new", "used_99", "used_good", "used_fair"],
      default: "new"
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
    usedDetails: {
      color: { type: String, trim: true, default: "" },
      batteryHealth: { type: String, trim: true, default: "" },
      warranty: { type: String, trim: true, default: "" },
      screenStatus: { type: String, trim: true, default: "" },
      bodyStatus: { type: String, trim: true, default: "" },
      faceIdStatus: { type: String, trim: true, default: "" },
      accessories: { type: String, trim: true, default: "" },
      repairHistory: { type: String, trim: true, default: "" },
      note: { type: String, trim: true, default: "" }
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
