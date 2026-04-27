import dotenv from "dotenv";
import mongoose from "mongoose";
import Product from "../models/Product.js";

dotenv.config();

const sampleProducts = [
  {
    name: "iPhone 15 Pro Max",
    brand: "Apple",
    price: 32990000,
    stock: 12,
    images: ["https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=900&q=80"],
    description: "Mau iPhone cao cap voi khung titan, camera manh va hieu nang on dinh.",
    specs: {
      screen: "6.7 inch Super Retina XDR",
      chip: "A17 Pro",
      ram: "8GB",
      storage: "256GB",
      battery: "4422 mAh",
      camera: "48MP + 12MP + 12MP"
    }
  },
  {
    name: "Samsung Galaxy S24 Ultra",
    brand: "Samsung",
    price: 28990000,
    stock: 10,
    images: ["https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=900&q=80"],
    description: "Flagship Android man hinh lon, but S Pen va camera zoom xa.",
    specs: {
      screen: "6.8 inch Dynamic AMOLED 2X",
      chip: "Snapdragon 8 Gen 3",
      ram: "12GB",
      storage: "256GB",
      battery: "5000 mAh",
      camera: "200MP + 50MP + 12MP + 10MP"
    }
  },
  {
    name: "Xiaomi 14",
    brand: "Xiaomi",
    price: 19990000,
    stock: 15,
    images: ["https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80"],
    description: "Dien thoai nho gon, hieu nang cao va camera Leica an tuong.",
    specs: {
      screen: "6.36 inch AMOLED",
      chip: "Snapdragon 8 Gen 3",
      ram: "12GB",
      storage: "256GB",
      battery: "4610 mAh",
      camera: "50MP + 50MP + 50MP"
    }
  },
  {
    name: "OPPO Reno11 Pro",
    brand: "OPPO",
    price: 16990000,
    stock: 20,
    images: ["https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=900&q=80"],
    description: "Thiet ke dep, camera chan dung tot va sac nhanh phu hop nguoi dung tre.",
    specs: {
      screen: "6.7 inch OLED",
      chip: "Dimensity 8200",
      ram: "12GB",
      storage: "512GB",
      battery: "4600 mAh",
      camera: "50MP + 32MP + 8MP"
    }
  },
  {
    name: "vivo V30",
    brand: "vivo",
    price: 13990000,
    stock: 18,
    images: ["https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=900&q=80"],
    description: "Tap trung vao camera selfie, thiet ke mong va man hinh dep.",
    specs: {
      screen: "6.78 inch AMOLED",
      chip: "Snapdragon 7 Gen 3",
      ram: "12GB",
      storage: "256GB",
      battery: "5000 mAh",
      camera: "50MP + 50MP"
    }
  },
  {
    name: "realme 12 Pro+",
    brand: "realme",
    price: 12990000,
    stock: 25,
    images: ["https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=900&q=80"],
    description: "May tam trung noi bat voi camera zoom tiem can phan khuc cao cap.",
    specs: {
      screen: "6.7 inch OLED",
      chip: "Snapdragon 7s Gen 2",
      ram: "12GB",
      storage: "256GB",
      battery: "5000 mAh",
      camera: "50MP + 64MP + 8MP"
    }
  }
];

async function seedProducts() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing in .env");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    await Product.deleteMany({});
    console.log("Deleted old products");

    await Product.insertMany(sampleProducts);
    console.log("Inserted sample products successfully");
  } catch (error) {
    console.error("Seed error:", error.message);
  } finally {
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
}

seedProducts();
