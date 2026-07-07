import dotenv from "dotenv";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import User from "../models/User.js";

dotenv.config();

const demoUsers = [
  {
    name: "Admin Demo",
    email: "admin@example.com",
    password: "admin123",
    role: "admin"
  },
  {
    name: "Khach Hang Demo",
    email: "user@example.com",
    password: "user123",
    role: "user"
  }
];

const baseSampleProducts = [
  {
    name: "iPhone 15 Pro Max 256GB",
    brand: "Apple",
    price: 32990000,
    stock: 2,
    condition: "used_99",
    images: [
      "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=900&q=80"
    ],
    description:
      "May cu dep, hinh thuc gan nhu moi, phu hop khach muon iPhone cao cap voi gia mem hon may moi.",
    usedDetails: {
      color: "Titan tu nhien",
      batteryHealth: "89%",
      warranty: "Bao hanh 6 thang",
      screenStatus: "Man hinh zin, khong am, khong dom",
      bodyStatus: "Tray nhe vien, tong the dep",
      faceIdStatus: "Hoat dong binh thuong",
      accessories: "Cap sac",
      repairHistory: "Chua sua chua",
      note: "Phu hop khach uu tien hieu nang, camera va thoi luong su dung."
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
    name: "Samsung Galaxy S24 Ultra 256GB",
    brand: "Samsung",
    price: 28990000,
    stock: 1,
    condition: "used_good",
    images: [
      "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=900&q=80"
    ],
    description:
      "Flagship Android man hinh lon, hieu nang manh, phu hop nguoi can may cao cap de lam viec va giai tri.",
    usedDetails: {
      color: "Den",
      batteryHealth: "87%",
      warranty: "Bao hanh 6 thang",
      screenStatus: "Man hinh dep, khong am",
      bodyStatus: "Xuoc nhe vien may",
      faceIdStatus: "Khong co",
      accessories: "May tran",
      repairHistory: "Chua sua chua",
      note: "May van hoat dong on dinh, ngoai hinh kha."
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
    name: "Xiaomi 14 256GB",
    brand: "Xiaomi",
    price: 19990000,
    stock: 2,
    condition: "used_good",
    images: [
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80"
    ],
    description:
      "May nho gon, camera tot, phu hop khach can Android hieu nang cao de su dung hang ngay.",
    usedDetails: {
      color: "Xanh",
      batteryHealth: "90%",
      warranty: "Bao hanh 3 thang",
      screenStatus: "Man zin, hien thi tot",
      bodyStatus: "Can nhe goc tren",
      faceIdStatus: "Khong co",
      accessories: "Cap sac + op lung",
      repairHistory: "Chua sua chua",
      note: "May dung on, ngoai hinh kha."
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
    name: "OPPO Reno11 Pro 512GB",
    brand: "Oppo",
    price: 16990000,
    stock: 3,
    condition: "used_fair",
    images: [
      "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=900&q=80"
    ],
    description:
      "May cu gia mem, camera on, phu hop khach can dien thoai dep de dung co ban.",
    usedDetails: {
      color: "Trang",
      batteryHealth: "84%",
      warranty: "Bao hanh 3 thang",
      screenStatus: "Man zin, co xuoc nho",
      bodyStatus: "Xuoc vien va lung nhe",
      faceIdStatus: "Khong co",
      accessories: "May tran",
      repairHistory: "Da thay pin",
      note: "May dung tot, ngoai hinh trung binh."
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
    name: "iPhone 13 128GB",
    brand: "Apple",
    price: 12990000,
    stock: 4,
    condition: "used_good",
    images: [
      "https://images.unsplash.com/photo-1632633173522-110d20ca9b90?auto=format&fit=crop&w=900&q=80"
    ],
    description:
      "Mau iPhone pho thong, hieu nang on dinh, phu hop hoc sinh sinh vien va nguoi dung co ban.",
    usedDetails: {
      color: "Xanh la",
      batteryHealth: "86%",
      warranty: "Bao hanh 3 thang",
      screenStatus: "Man zin, hien thi ro",
      bodyStatus: "Ngoai hinh dep, xuoc nhe mat lung",
      faceIdStatus: "Hoat dong binh thuong",
      accessories: "Cap sac",
      repairHistory: "Chua sua chua",
      note: "Lua chon can bang giua gia va trai nghiem iOS."
    },
    specs: {
      screen: "6.1 inch Super Retina XDR",
      chip: "A15 Bionic",
      ram: "4GB",
      storage: "128GB",
      battery: "3240 mAh",
      camera: "12MP + 12MP"
    }
  },
  {
    name: "Samsung Galaxy A55 5G 256GB",
    brand: "Samsung",
    price: 9490000,
    stock: 5,
    condition: "new",
    images: [
      "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=900&q=80"
    ],
    description:
      "May moi tam trung, pin tot, man hinh dep, phu hop nguoi dung can dien thoai Android on dinh.",
    usedDetails: {
      color: "Xanh navy",
      batteryHealth: "100%",
      warranty: "Bao hanh chinh hang 12 thang",
      screenStatus: "May moi",
      bodyStatus: "May moi",
      faceIdStatus: "Khong co",
      accessories: "Fullbox",
      repairHistory: "Chua sua chua",
      note: "San pham moi, phu hop demo loc tinh trang may moi."
    },
    specs: {
      screen: "6.6 inch Super AMOLED",
      chip: "Exynos 1480",
      ram: "8GB",
      storage: "256GB",
      battery: "5000 mAh",
      camera: "50MP + 12MP + 5MP"
    }
  }
];

const extraProductTemplates = [
  {
    namePrefix: "iPhone 12",
    brand: "Apple",
    basePrice: 8990000,
    conditions: ["used_good", "used_99", "used_fair"],
    storages: ["64GB", "128GB", "256GB"],
    colors: ["Den", "Trang", "Tim"],
    image:
      "https://images.unsplash.com/photo-1609692814858-f7cd2f0afa4f?auto=format&fit=crop&w=900&q=80",
    chip: "A14 Bionic",
    ram: "4GB",
    battery: "2815 mAh",
    camera: "12MP + 12MP"
  },
  {
    namePrefix: "iPhone 14",
    brand: "Apple",
    basePrice: 14990000,
    conditions: ["used_good", "used_99", "new"],
    storages: ["128GB", "256GB"],
    colors: ["Xanh", "Den", "Do"],
    image:
      "https://images.unsplash.com/photo-1663499481254-42293b5d3d13?auto=format&fit=crop&w=900&q=80",
    chip: "A15 Bionic",
    ram: "6GB",
    battery: "3279 mAh",
    camera: "12MP + 12MP"
  },
  {
    namePrefix: "Samsung Galaxy S23",
    brand: "Samsung",
    basePrice: 15990000,
    conditions: ["used_good", "used_99", "new"],
    storages: ["128GB", "256GB"],
    colors: ["Den", "Kem", "Xanh la"],
    image:
      "https://images.unsplash.com/photo-1678911820864-e5b76b66c12c?auto=format&fit=crop&w=900&q=80",
    chip: "Snapdragon 8 Gen 2",
    ram: "8GB",
    battery: "3900 mAh",
    camera: "50MP + 12MP + 10MP"
  },
  {
    namePrefix: "Xiaomi Redmi Note 13 Pro",
    brand: "Xiaomi",
    basePrice: 7990000,
    conditions: ["used_good", "used_fair", "new"],
    storages: ["256GB", "512GB"],
    colors: ["Tim", "Den", "Trang"],
    image:
      "https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=900&q=80",
    chip: "Snapdragon 7s Gen 2",
    ram: "8GB",
    battery: "5100 mAh",
    camera: "200MP + 8MP + 2MP"
  },
  {
    namePrefix: "OPPO Reno10",
    brand: "Oppo",
    basePrice: 8990000,
    conditions: ["used_good", "used_fair", "new"],
    storages: ["256GB", "512GB"],
    colors: ["Xam", "Xanh", "Trang"],
    image:
      "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=900&q=80",
    chip: "Snapdragon 778G",
    ram: "8GB",
    battery: "5000 mAh",
    camera: "64MP + 32MP + 8MP"
  }
];

const conditionLabels = {
  new: "May moi",
  used_99: "May cu 99%",
  used_good: "May cu dep",
  used_fair: "May cu dung tot"
};

const conditionPrices = {
  new: 1200000,
  used_99: 500000,
  used_good: 0,
  used_fair: -900000
};

function buildExtraProducts() {
  const products = [];

  extraProductTemplates.forEach((template, templateIndex) => {
    template.storages.forEach((storage, storageIndex) => {
      template.conditions.forEach((condition, conditionIndex) => {
        const color =
          template.colors[(storageIndex + conditionIndex) % template.colors.length];
        const stock = Math.max(1, 4 - conditionIndex);
        const batteryValue =
          condition === "new" ? "100%" : `${90 - storageIndex * 2 - conditionIndex * 3}%`;
        const suffix = template.brand === "Apple" ? "" : " 5G";

        products.push({
          name: `${template.namePrefix}${suffix} ${storage}`,
          brand: template.brand,
          price: template.basePrice + conditionPrices[condition] + storageIndex * 700000,
          stock,
          condition,
          images: [template.image],
          description: `${conditionLabels[condition]}, phu hop khach can ${template.brand} da qua su dung voi gia hop ly.`,
          usedDetails: {
            color,
            batteryHealth: batteryValue,
            warranty: condition === "new" ? "Bao hanh 12 thang" : "Bao hanh 3 thang",
            screenStatus:
              condition === "used_fair"
                ? "Man dep, co xuoc nho vien tren"
                : "Man hinh on, hien thi ro net",
            bodyStatus:
              condition === "used_99"
                ? "Ngoai hinh rat dep, tray nhe kho nhin"
                : condition === "used_fair"
                  ? "Co tray vien va lung nhe"
                  : "Ngoai hinh dep, may dung on",
            faceIdStatus: template.brand === "Apple" ? "Hoat dong binh thuong" : "Khong co",
            accessories: condition === "new" ? "Fullbox" : "May tran + cap sac",
            repairHistory: condition === "used_fair" ? "Da thay pin" : "Chua sua chua",
            note: `Phien ban ${storage}, mau ${color}, phu hop nhu cau su dung hang ngay.`
          },
          specs: {
            screen: template.brand === "Apple" ? "Super Retina XDR" : "AMOLED",
            chip: template.chip,
            ram: template.ram,
            storage,
            battery: template.battery,
            camera: template.camera
          }
        });
      });
    });
  });

  return products.map((product, index) => ({
    ...product,
    name: `${product.name} - Lo ${index + 1}`
  }));
}

const sampleProducts = [...baseSampleProducts, ...buildExtraProducts()];

async function seedDatabase() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing in .env");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    await Promise.all([Product.deleteMany({}), User.deleteMany({})]);
    console.log("Deleted old demo products and users");

    await Product.insertMany(sampleProducts);

    for (const user of demoUsers) {
      await User.create(user);
    }

    console.log("Inserted demo products and users successfully");
    console.log(`Total demo products: ${sampleProducts.length}`);
    console.log(`Total demo users: ${demoUsers.length}`);
    console.log("Admin account: admin@example.com / admin123");
    console.log("User account: user@example.com / user123");
  } catch (error) {
    console.error("Seed error:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
}

seedDatabase();
