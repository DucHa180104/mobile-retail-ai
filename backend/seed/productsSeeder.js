import dotenv from "dotenv";
import mongoose from "mongoose";
import Product from "../models/Product.js";

dotenv.config();

const sampleProducts = [
  {
    name: "iPhone 15 Pro Max",
    brand: "Apple",
    price: 32990000,
    stock: 2,
    condition: "used_99",
    images: ["https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=900&q=80"],
    description: "May cu dep, hinh thuc on, phu hop khach muon may cao cap gia mem hon may moi.",
    usedDetails: {
      color: "Titan tu nhien",
      batteryHealth: "89%",
      warranty: "Bao hanh 6 thang",
      screenStatus: "Man hinh zin, khong am, khong dom",
      bodyStatus: "Trầy nhẹ viền, tổng thể đẹp",
      faceIdStatus: "Hoat dong binh thuong",
      accessories: "Cap sac",
      repairHistory: "Chua sua chua",
      note: "May cu dep, phu hop khach uu tien hieu nang va camera"
    },
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
    stock: 1,
    condition: "used_good",
    images: ["https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=900&q=80"],
    description: "May cu flagship man hinh lon, hieu nang manh, phu hop nguoi can Android cao cap.",
    usedDetails: {
      color: "Den",
      batteryHealth: "87%",
      warranty: "Bao hanh 6 thang",
      screenStatus: "Man hinh dep, khong am",
      bodyStatus: "Xuoc nhe vien may",
      faceIdStatus: "Khong co",
      accessories: "May tran",
      repairHistory: "Chua sua chua",
      note: "May cu dep, van hoat dong on dinh"
    },
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
    stock: 2,
    condition: "used_good",
    images: ["https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80"],
    description: "May cu nho gon, camera tot, phu hop khach can may Android de dung hang ngay.",
    usedDetails: {
      color: "Xanh",
      batteryHealth: "90%",
      warranty: "Bao hanh 3 thang",
      screenStatus: "Man zin, hien thi tot",
      bodyStatus: "Cấn nhẹ góc trên",
      faceIdStatus: "Khong co",
      accessories: "Cap sac + op lung",
      repairHistory: "Chua sua chua",
      note: "May cu dung on, ngoai hinh kha"
    },
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
    stock: 3,
    condition: "used_fair",
    images: ["https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=900&q=80"],
    description: "May cu gia mem, camera on, phu hop khach can may dep de dung co ban.",
    usedDetails: {
      color: "Trang",
      batteryHealth: "84%",
      warranty: "Bao hanh 3 thang",
      screenStatus: "Man zin, co xuoc nho",
      bodyStatus: "Xuoc vien va lung nhe",
      faceIdStatus: "Khong co",
      accessories: "May tran",
      repairHistory: "Da thay pin",
      note: "May cu dung tot, ngoai hinh trung binh"
    },
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
    stock: 2,
    condition: "used_good",
    images: ["https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=900&q=80"],
    description: "May cu tap trung camera selfie, phu hop khach tre thich chup anh va may dep.",
    usedDetails: {
      color: "Tim",
      batteryHealth: "88%",
      warranty: "Bao hanh 3 thang",
      screenStatus: "Man dep, khong dom",
      bodyStatus: "Ngoai hinh dep, tray nhe phan vien",
      faceIdStatus: "Khong co",
      accessories: "May tran + cap sac",
      repairHistory: "Chua sua chua",
      note: "May cu dep, pin con tot"
    },
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
    stock: 2,
    condition: "used_fair",
    images: ["https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=900&q=80"],
    description: "May cu tam trung, gia tot, phu hop khach can may dung on dinh va camera kha.",
    usedDetails: {
      color: "Den",
      batteryHealth: "82%",
      warranty: "Bao hanh 1 thang",
      screenStatus: "Man hinh ro, co xuoc nhe",
      bodyStatus: "Trầy xước rõ phần lưng",
      faceIdStatus: "Khong co",
      accessories: "May tran",
      repairHistory: "Da thay pin",
      note: "May cu gia mem, phu hop nguoi can tiet kiem"
    },
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
