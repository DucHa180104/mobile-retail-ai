import dotenv from "dotenv";
import mongoose from "mongoose";
import TradeInPricingRule from "../models/TradeInPricingRule.js";

dotenv.config();

const defaultDeductionRules = {
  battery80To85: 400000,
  batteryBelow80: 700000,
  displayReplaced: 1000000,
  displayUnknown: 500000,
  bodyLightScratches: 300000,
  bodyHeavyScratches: 800000,
  faceIdBroken: 1200000,
  missingBoxOrCable: 300000
};

const phonePricingCatalog = [
  {
    brand: "Apple",
    modelName: "iPhone 11",
    basePrice: 5200000,
    storages: [
      { storage: "64GB", priceDelta: 0 },
      { storage: "128GB", priceDelta: 700000 }
    ]
  },
  {
    brand: "Apple",
    modelName: "iPhone 11 Pro Max",
    basePrice: 7600000,
    storages: [
      { storage: "64GB", priceDelta: 0 },
      { storage: "256GB", priceDelta: 1200000 }
    ]
  },
  {
    brand: "Apple",
    modelName: "iPhone 12",
    basePrice: 6900000,
    storages: [
      { storage: "64GB", priceDelta: 0 },
      { storage: "128GB", priceDelta: 700000 },
      { storage: "256GB", priceDelta: 1500000 }
    ]
  },
  {
    brand: "Apple",
    modelName: "iPhone 12 Pro Max",
    basePrice: 10900000,
    storages: [
      { storage: "128GB", priceDelta: 0 },
      { storage: "256GB", priceDelta: 1200000 },
      { storage: "512GB", priceDelta: 2600000 }
    ]
  },
  {
    brand: "Apple",
    modelName: "iPhone 13",
    basePrice: 9000000,
    storages: [
      { storage: "128GB", priceDelta: 0 },
      { storage: "256GB", priceDelta: 1200000 }
    ]
  },
  {
    brand: "Apple",
    modelName: "iPhone 13 Pro Max",
    basePrice: 13500000,
    storages: [
      { storage: "128GB", priceDelta: 0 },
      { storage: "256GB", priceDelta: 1400000 },
      { storage: "512GB", priceDelta: 2900000 }
    ]
  },
  {
    brand: "Apple",
    modelName: "iPhone 14",
    basePrice: 11800000,
    storages: [
      { storage: "128GB", priceDelta: 0 },
      { storage: "256GB", priceDelta: 1200000 }
    ]
  },
  {
    brand: "Apple",
    modelName: "iPhone 14 Plus",
    basePrice: 12800000,
    storages: [
      { storage: "128GB", priceDelta: 0 },
      { storage: "256GB", priceDelta: 1200000 }
    ]
  },
  {
    brand: "Apple",
    modelName: "iPhone 14 Pro Max",
    basePrice: 16800000,
    storages: [
      { storage: "128GB", priceDelta: 0 },
      { storage: "256GB", priceDelta: 1500000 },
      { storage: "512GB", priceDelta: 3200000 }
    ]
  },
  {
    brand: "Apple",
    modelName: "iPhone 15",
    basePrice: 15000000,
    storages: [
      { storage: "128GB", priceDelta: 0 },
      { storage: "256GB", priceDelta: 1400000 }
    ]
  },
  {
    brand: "Apple",
    modelName: "iPhone 15 Plus",
    basePrice: 16400000,
    storages: [
      { storage: "128GB", priceDelta: 0 },
      { storage: "256GB", priceDelta: 1400000 }
    ]
  },
  {
    brand: "Apple",
    modelName: "iPhone 15 Pro Max",
    basePrice: 21900000,
    storages: [
      { storage: "256GB", priceDelta: 0 },
      { storage: "512GB", priceDelta: 3200000 },
      { storage: "1TB", priceDelta: 6000000 }
    ]
  },
  {
    brand: "Samsung",
    modelName: "Samsung Galaxy A35 5G",
    basePrice: 4200000,
    storages: [
      { storage: "128GB", priceDelta: 0 },
      { storage: "256GB", priceDelta: 600000 }
    ]
  },
  {
    brand: "Samsung",
    modelName: "Samsung Galaxy A55 5G",
    basePrice: 5200000,
    storages: [
      { storage: "128GB", priceDelta: 0 },
      { storage: "256GB", priceDelta: 700000 }
    ]
  },
  {
    brand: "Samsung",
    modelName: "Samsung Galaxy S23",
    basePrice: 9800000,
    storages: [
      { storage: "128GB", priceDelta: 0 },
      { storage: "256GB", priceDelta: 1300000 }
    ]
  },
  {
    brand: "Samsung",
    modelName: "Samsung Galaxy S23 Ultra",
    basePrice: 16400000,
    storages: [
      { storage: "256GB", priceDelta: 0 },
      { storage: "512GB", priceDelta: 2200000 }
    ]
  },
  {
    brand: "Samsung",
    modelName: "Samsung Galaxy S24",
    basePrice: 12800000,
    storages: [
      { storage: "256GB", priceDelta: 0 },
      { storage: "512GB", priceDelta: 1800000 }
    ]
  },
  {
    brand: "Samsung",
    modelName: "Samsung Galaxy S24 Ultra",
    basePrice: 21200000,
    storages: [
      { storage: "256GB", priceDelta: 0 },
      { storage: "512GB", priceDelta: 2500000 }
    ]
  },
  {
    brand: "Samsung",
    modelName: "Samsung Galaxy Z Flip5",
    basePrice: 11200000,
    storages: [{ storage: "256GB", priceDelta: 0 }]
  },
  {
    brand: "Samsung",
    modelName: "Samsung Galaxy Z Fold5",
    basePrice: 23800000,
    storages: [
      { storage: "256GB", priceDelta: 0 },
      { storage: "512GB", priceDelta: 2600000 }
    ]
  },
  {
    brand: "Xiaomi",
    modelName: "Xiaomi Redmi Note 13",
    basePrice: 3200000,
    storages: [
      { storage: "128GB", priceDelta: 0 },
      { storage: "256GB", priceDelta: 500000 }
    ]
  },
  {
    brand: "Xiaomi",
    modelName: "Xiaomi Redmi Note 13 Pro",
    basePrice: 4500000,
    storages: [
      { storage: "256GB", priceDelta: 0 },
      { storage: "512GB", priceDelta: 800000 }
    ]
  },
  {
    brand: "Xiaomi",
    modelName: "Xiaomi Redmi Note 13 Pro 5G",
    basePrice: 5200000,
    storages: [
      { storage: "256GB", priceDelta: 0 },
      { storage: "512GB", priceDelta: 900000 }
    ]
  },
  {
    brand: "Xiaomi",
    modelName: "Xiaomi 13T",
    basePrice: 7200000,
    storages: [{ storage: "256GB", priceDelta: 0 }]
  },
  {
    brand: "Xiaomi",
    modelName: "Xiaomi 13T Pro",
    basePrice: 8900000,
    storages: [
      { storage: "256GB", priceDelta: 0 },
      { storage: "512GB", priceDelta: 1300000 }
    ]
  },
  {
    brand: "Xiaomi",
    modelName: "Xiaomi 14",
    basePrice: 13200000,
    storages: [
      { storage: "256GB", priceDelta: 0 },
      { storage: "512GB", priceDelta: 1800000 }
    ]
  },
  {
    brand: "Oppo",
    modelName: "OPPO Reno11 F 5G",
    basePrice: 4200000,
    storages: [{ storage: "256GB", priceDelta: 0 }]
  },
  {
    brand: "Oppo",
    modelName: "OPPO Reno11 5G",
    basePrice: 5500000,
    storages: [{ storage: "256GB", priceDelta: 0 }]
  },
  {
    brand: "Oppo",
    modelName: "OPPO A98 5G",
    basePrice: 3500000,
    storages: [{ storage: "256GB", priceDelta: 0 }]
  },
  {
    brand: "Oppo",
    modelName: "OPPO Find N3 Flip",
    basePrice: 11200000,
    storages: [{ storage: "256GB", priceDelta: 0 }]
  }
];

function buildPricingRules() {
  return phonePricingCatalog.flatMap((item) =>
    item.storages.map((storageOption) => ({
      brand: item.brand,
      modelName: item.modelName,
      storage: storageOption.storage,
      basePrice: item.basePrice + storageOption.priceDelta,
      deductionRules: defaultDeductionRules,
      isActive: true,
      note: `Dữ liệu seed demo cho ${item.modelName} ${storageOption.storage}`
    }))
  );
}

async function seedTradeInPricingRules() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing in .env");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Đã kết nối MongoDB");

    const pricingRules = buildPricingRules();

    await TradeInPricingRule.deleteMany({});
    console.log("Đã xóa bảng giá thu cũ cũ");

    await TradeInPricingRule.insertMany(pricingRules);
    console.log(`Đã thêm ${pricingRules.length} rule giá thu cũ`);
  } catch (error) {
    console.error("Lỗi seed Trade-In pricing:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log("Đã đóng kết nối MongoDB");
  }
}

seedTradeInPricingRules();
