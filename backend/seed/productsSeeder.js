import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
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
    name: "Khách Hàng Demo",
    email: "user@example.com",
    password: "user123",
    role: "user"
  }
];

const catalogImageMap = {
  "iPhone 11": "/uploads/catalog/iphone-11.svg",
  "iPhone 12": "/uploads/catalog/iphone-12.svg",
  "iPhone 13": "/uploads/catalog/iphone-13.svg",
  "iPhone 14": "/uploads/catalog/iphone-14.svg",
  "iPhone 15": "/uploads/catalog/iphone-15.svg",
  "iPhone 15 Pro Max": "/uploads/catalog/iphone-15-pro-max.svg",
  "Samsung Galaxy A55 5G": "/uploads/catalog/samsung-galaxy-a55-5g.svg",
  "Samsung Galaxy S23": "/uploads/catalog/samsung-galaxy-s23.svg",
  "Samsung Galaxy S24 Ultra": "/uploads/catalog/samsung-galaxy-s24-ultra.svg",
  "Samsung Galaxy Z Flip5": "/uploads/catalog/samsung-galaxy-z-flip5.svg",
  "Xiaomi Redmi Note 13 Pro 5G": "/uploads/catalog/xiaomi-redmi-note-13-pro-5g.svg",
  "Xiaomi 14": "/uploads/catalog/xiaomi-14.svg",
  "Xiaomi 13T Pro": "/uploads/catalog/xiaomi-13t-pro.svg",
  "OPPO Reno11 5G": "/uploads/catalog/oppo-reno11-5g.svg",
  "OPPO Find N3 Flip": "/uploads/catalog/oppo-find-n3-flip.svg",
  "iPad Gen 10 WiFi": "/uploads/catalog/ipad-gen-10-wifi.svg",
  "iPad Air M1 WiFi": "/uploads/catalog/ipad-air-m1-wifi.svg",
  "iPad Air M2 WiFi": "/uploads/catalog/ipad-air-m2-wifi.svg",
  "iPad Pro 11 M2 WiFi": "/uploads/catalog/ipad-pro-11-m2-wifi.svg",
  "Samsung Galaxy Tab S9 FE": "/uploads/catalog/samsung-galaxy-tab-s9-fe.svg",
  "Samsung Galaxy Tab S8": "/uploads/catalog/samsung-galaxy-tab-s8.svg",
  "Xiaomi Pad 6": "/uploads/catalog/xiaomi-pad-6.svg",
  "Lenovo Tab P12": "/uploads/catalog/lenovo-tab-p12.svg",
  "Tai nghe AirPods 2": "/uploads/catalog/tai-nghe-airpods-2.svg",
  "Tai nghe AirPods 3": "/uploads/catalog/tai-nghe-airpods-3.svg",
  "Tai nghe AirPods Pro 2 USB-C": "/uploads/catalog/tai-nghe-airpods-pro-2-usb-c.svg",
  "Tai nghe JBL Tune 520BT": "/uploads/catalog/tai-nghe-jbl-tune-520bt.svg",
  "Tai nghe Bluetooth Samsung Galaxy Buds FE": "/uploads/catalog/tai-nghe-samsung-galaxy-buds-fe.svg",
  "Củ sạc nhanh Anker 20W USB-C": "/uploads/catalog/cu-sac-nhanh-anker-20w-usb-c.svg",
  "Củ sạc nhanh Anker 30W USB-C": "/uploads/catalog/cu-sac-nhanh-anker-30w-usb-c.svg",
  "Cáp sạc Type-C to Type-C Baseus 100W": "/uploads/catalog/cap-sac-type-c-baseus-100w.svg",
  "Cáp sạc Lightning Apple 1m": "/uploads/catalog/cap-sac-lightning-apple-1m.svg",
  "Đế sạc không dây Samsung 15W": "/uploads/catalog/de-sac-khong-day-samsung-15w.svg",
  "Apple Pencil USB-C": "/uploads/catalog/apple-pencil-usb-c.svg",
  "Apple Pencil Gen 2": "/uploads/catalog/apple-pencil-gen-2.svg",
  "Bàn phím Bluetooth cho iPad": "/uploads/catalog/ban-phim-bluetooth-cho-ipad.svg",
  "Bao da bàn phím Galaxy Tab S9 FE": "/uploads/catalog/bao-da-ban-phim-galaxy-tab-s9-fe.svg",
  "Ốp lưng MagSafe cho iPhone 15": "/uploads/catalog/op-lung-magsafe-cho-iphone-15.svg",
  "Bao da iPad Air 11 inch": "/uploads/catalog/bao-da-ipad-air-11-inch.svg",
  "Ốp chống sốc Galaxy S24 Ultra": "/uploads/catalog/op-chong-soc-galaxy-s24-ultra.svg",
  "Bao da Xiaomi Pad 6": "/uploads/catalog/bao-da-xiaomi-pad-6.svg",
  "Pin sạc dự phòng Anker 10000mAh": "/uploads/catalog/pin-sac-du-phong-anker-10000mah.svg",
  "Pin sạc dự phòng Baseus 20000mAh": "/uploads/catalog/pin-sac-du-phong-baseus-20000mah.svg"
};

function getCatalogImage(key) {
  return catalogImageMap[key] || "/uploads/catalog/default-product.svg";
}

const conditionMeta = {
  new: {
    label: "Máy mới",
    priceDelta: 1200000,
    warranty: "Bảo hành 12 tháng",
    batteryHealth: "100%",
    screenStatus: "Máy mới, màn hình đẹp",
    bodyStatus: "Máy mới, ngoại hình hoàn hảo",
    repairHistory: "Chưa sửa chữa"
  },
  used_99: {
    label: "Cũ 99%",
    priceDelta: 500000,
    warranty: "Bảo hành 6 tháng",
    batteryHealth: "92%",
    screenStatus: "Màn hình đẹp, hiển thị rõ nét",
    bodyStatus: "Ngoại hình rất đẹp, trầy nhẹ khó thấy",
    repairHistory: "Chưa sửa chữa"
  },
  used_good: {
    label: "Cũ đẹp",
    priceDelta: 0,
    warranty: "Bảo hành 3 tháng",
    batteryHealth: "88%",
    screenStatus: "Màn hình đẹp, cảm ứng ổn định",
    bodyStatus: "Ngoại hình đẹp, có vài vết xước nhẹ",
    repairHistory: "Chưa sửa chữa"
  },
  used_fair: {
    label: "Cũ dùng tốt",
    priceDelta: -900000,
    warranty: "Bảo hành 1 tháng",
    batteryHealth: "84%",
    screenStatus: "Màn hình sáng rõ, có xước nhẹ viền trên",
    bodyStatus: "Có trầy viền và cấn nhẹ góc máy",
    repairHistory: "Đã thay pin hoặc bảo dưỡng cơ bản"
  }
};

const phoneSeries = [
  {
    name: "iPhone 11",
    brand: "Apple",
    basePrice: 6990000,
    storages: ["64GB", "128GB"],
    colors: ["Đen", "Trắng", "Tím"],
    conditions: ["used_good", "used_99", "used_fair"],
    specs: {
      screen: "6.1 inch Liquid Retina",
      chip: "Apple A13 Bionic",
      ram: "4GB",
      battery: "3.110 mAh",
      camera: "12MP + 12MP"
    }
  },
  {
    name: "iPhone 12",
    brand: "Apple",
    basePrice: 8890000,
    storages: ["64GB", "128GB", "256GB"],
    colors: ["Đen", "Trắng", "Xanh dương", "Tím"],
    conditions: ["used_good", "used_99", "used_fair"],
    specs: {
      screen: "6.1 inch Super Retina XDR",
      chip: "Apple A14 Bionic",
      ram: "4GB",
      battery: "2.815 mAh",
      camera: "12MP + 12MP"
    }
  },
  {
    name: "iPhone 13",
    brand: "Apple",
    basePrice: 11290000,
    storages: ["128GB", "256GB"],
    colors: ["Đen", "Hồng", "Xanh lá", "Trắng"],
    conditions: ["used_good", "used_99", "new"],
    specs: {
      screen: "6.1 inch Super Retina XDR",
      chip: "Apple A15 Bionic",
      ram: "4GB",
      battery: "3.240 mAh",
      camera: "12MP + 12MP"
    }
  },
  {
    name: "iPhone 14",
    brand: "Apple",
    basePrice: 14990000,
    storages: ["128GB", "256GB"],
    colors: ["Đen", "Xanh", "Tím", "Đỏ"],
    conditions: ["used_good", "used_99", "new"],
    specs: {
      screen: "6.1 inch Super Retina XDR",
      chip: "Apple A15 Bionic",
      ram: "6GB",
      battery: "3.279 mAh",
      camera: "12MP + 12MP"
    }
  },
  {
    name: "iPhone 15",
    brand: "Apple",
    basePrice: 18990000,
    storages: ["128GB", "256GB"],
    colors: ["Đen", "Hồng", "Xanh lá", "Vàng"],
    conditions: ["used_99", "new"],
    specs: {
      screen: "6.1 inch Super Retina XDR",
      chip: "Apple A16 Bionic",
      ram: "6GB",
      battery: "3.349 mAh",
      camera: "48MP + 12MP"
    }
  },
  {
    name: "iPhone 15 Pro Max",
    brand: "Apple",
    basePrice: 29490000,
    storages: ["256GB", "512GB"],
    colors: ["Titan Tự nhiên", "Titan Xanh", "Titan Đen"],
    conditions: ["used_99", "new"],
    specs: {
      screen: "6.7 inch Super Retina XDR",
      chip: "Apple A17 Pro",
      ram: "8GB",
      battery: "4.422 mAh",
      camera: "48MP + 12MP + 12MP"
    }
  },
  {
    name: "Samsung Galaxy A55 5G",
    brand: "Samsung",
    basePrice: 8990000,
    storages: ["128GB", "256GB"],
    colors: ["Xanh navy", "Vàng", "Tím"],
    conditions: ["new", "used_99"],
    specs: {
      screen: "6.6 inch Super AMOLED 120Hz",
      chip: "Exynos 1480",
      ram: "8GB",
      battery: "5.000 mAh",
      camera: "50MP + 12MP + 5MP"
    }
  },
  {
    name: "Samsung Galaxy S23",
    brand: "Samsung",
    basePrice: 14990000,
    storages: ["128GB", "256GB"],
    colors: ["Đen", "Kem", "Xanh lá"],
    conditions: ["used_good", "used_99", "new"],
    specs: {
      screen: "6.1 inch Dynamic AMOLED 2X",
      chip: "Snapdragon 8 Gen 2 for Galaxy",
      ram: "8GB",
      battery: "3.900 mAh",
      camera: "50MP + 12MP + 10MP"
    }
  },
  {
    name: "Samsung Galaxy S24 Ultra",
    brand: "Samsung",
    basePrice: 27990000,
    storages: ["256GB", "512GB"],
    colors: ["Đen", "Xám", "Vàng cát"],
    conditions: ["used_99", "new"],
    specs: {
      screen: "6.8 inch Dynamic AMOLED 2X",
      chip: "Snapdragon 8 Gen 3 for Galaxy",
      ram: "12GB",
      battery: "5.000 mAh",
      camera: "200MP + 50MP + 12MP + 10MP"
    }
  },
  {
    name: "Samsung Galaxy Z Flip5",
    brand: "Samsung",
    basePrice: 16990000,
    storages: ["256GB", "512GB"],
    colors: ["Mint", "Kem", "Tím"],
    conditions: ["used_good", "used_99"],
    specs: {
      screen: "6.7 inch Dynamic AMOLED 2X",
      chip: "Snapdragon 8 Gen 2 for Galaxy",
      ram: "8GB",
      battery: "3.700 mAh",
      camera: "12MP + 12MP"
    }
  },
  {
    name: "Xiaomi Redmi Note 13 Pro 5G",
    brand: "Xiaomi",
    basePrice: 7590000,
    storages: ["256GB", "512GB"],
    colors: ["Tím", "Đen", "Trắng"],
    conditions: ["new", "used_99", "used_good"],
    specs: {
      screen: "6.67 inch AMOLED 120Hz",
      chip: "Snapdragon 7s Gen 2",
      ram: "8GB",
      battery: "5.100 mAh",
      camera: "200MP + 8MP + 2MP"
    }
  },
  {
    name: "Xiaomi 14",
    brand: "Xiaomi",
    basePrice: 18990000,
    storages: ["256GB", "512GB"],
    colors: ["Đen", "Xanh", "Trắng"],
    conditions: ["used_good", "used_99", "new"],
    specs: {
      screen: "6.36 inch AMOLED 120Hz",
      chip: "Snapdragon 8 Gen 3",
      ram: "12GB",
      battery: "4.610 mAh",
      camera: "50MP + 50MP + 50MP"
    }
  },
  {
    name: "Xiaomi 13T Pro",
    brand: "Xiaomi",
    basePrice: 12990000,
    storages: ["256GB", "512GB"],
    colors: ["Đen", "Xanh dương"],
    conditions: ["used_good", "used_99", "new"],
    specs: {
      screen: "6.67 inch AMOLED 144Hz",
      chip: "Dimensity 9200+",
      ram: "12GB",
      battery: "5.000 mAh",
      camera: "50MP + 50MP + 12MP"
    }
  },
  {
    name: "OPPO Reno11 5G",
    brand: "Oppo",
    basePrice: 10990000,
    storages: ["256GB", "512GB"],
    colors: ["Xanh", "Xám", "Trắng"],
    conditions: ["used_good", "used_99", "new"],
    specs: {
      screen: "6.7 inch AMOLED 120Hz",
      chip: "Dimensity 7050",
      ram: "8GB",
      battery: "5.000 mAh",
      camera: "50MP + 32MP + 8MP"
    }
  },
  {
    name: "OPPO Find N3 Flip",
    brand: "Oppo",
    basePrice: 17990000,
    storages: ["256GB"],
    colors: ["Kem", "Đen"],
    conditions: ["used_good", "used_99"],
    specs: {
      screen: "6.8 inch AMOLED 120Hz",
      chip: "Dimensity 9200",
      ram: "12GB",
      battery: "4.300 mAh",
      camera: "50MP + 32MP + 48MP"
    }
  }
];

const tabletSeries = [
  {
    name: "iPad Gen 10 WiFi",
    brand: "Apple",
    basePrice: 8990000,
    storages: ["64GB", "256GB"],
    colors: ["Xanh", "Hồng", "Bạc"],
    conditions: ["used_good", "used_99", "new"],
    specs: {
      screen: "10.9 inch Liquid Retina",
      chip: "Apple A14 Bionic",
      ram: "4GB",
      battery: "Dùng liên tục khoảng 10 giờ",
      camera: "12MP"
    }
  },
  {
    name: "iPad Air M1 WiFi",
    brand: "Apple",
    basePrice: 12990000,
    storages: ["64GB", "256GB"],
    colors: ["Xám", "Xanh", "Tím"],
    conditions: ["used_good", "used_99"],
    specs: {
      screen: "10.9 inch Liquid Retina",
      chip: "Apple M1",
      ram: "8GB",
      battery: "Dùng liên tục khoảng 10 giờ",
      camera: "12MP"
    }
  },
  {
    name: "iPad Air M2 WiFi",
    brand: "Apple",
    basePrice: 17990000,
    storages: ["128GB", "256GB"],
    colors: ["Xám", "Xanh", "Tím"],
    conditions: ["new", "used_99"],
    specs: {
      screen: "11 inch Liquid Retina",
      chip: "Apple M2",
      ram: "8GB",
      battery: "Dùng liên tục khoảng 10 giờ",
      camera: "12MP"
    }
  },
  {
    name: "iPad Pro 11 M2 WiFi",
    brand: "Apple",
    basePrice: 22990000,
    storages: ["128GB", "256GB", "512GB"],
    colors: ["Bạc", "Xám không gian"],
    conditions: ["new", "used_99"],
    specs: {
      screen: "11 inch Liquid Retina XDR",
      chip: "Apple M2",
      ram: "8GB",
      battery: "Dùng liên tục khoảng 10 giờ",
      camera: "12MP + 10MP"
    }
  },
  {
    name: "Samsung Galaxy Tab S9 FE",
    brand: "Samsung",
    basePrice: 10990000,
    storages: ["128GB", "256GB"],
    colors: ["Xám", "Bạc", "Xanh lá"],
    conditions: ["new", "used_99"],
    specs: {
      screen: "10.9 inch LCD 90Hz",
      chip: "Exynos 1380",
      ram: "6GB",
      battery: "8.000 mAh",
      camera: "8MP"
    }
  },
  {
    name: "Samsung Galaxy Tab S8",
    brand: "Samsung",
    basePrice: 13990000,
    storages: ["128GB", "256GB"],
    colors: ["Xám", "Hồng vàng"],
    conditions: ["used_good", "used_99"],
    specs: {
      screen: "11 inch LTPS 120Hz",
      chip: "Snapdragon 8 Gen 1",
      ram: "8GB",
      battery: "8.000 mAh",
      camera: "13MP + 6MP"
    }
  },
  {
    name: "Xiaomi Pad 6",
    brand: "Xiaomi",
    basePrice: 7890000,
    storages: ["128GB", "256GB"],
    colors: ["Xanh", "Vàng", "Xám"],
    conditions: ["used_good", "used_99", "new"],
    specs: {
      screen: "11 inch LCD 144Hz",
      chip: "Snapdragon 870",
      ram: "8GB",
      battery: "8.840 mAh",
      camera: "13MP"
    }
  },
  {
    name: "Lenovo Tab P12",
    brand: "Lenovo",
    basePrice: 9490000,
    storages: ["128GB", "256GB"],
    colors: ["Xám", "Xanh dương"],
    conditions: ["new", "used_99"],
    specs: {
      screen: "12.7 inch LCD 3K",
      chip: "Dimensity 7050",
      ram: "8GB",
      battery: "10.200 mAh",
      camera: "8MP"
    }
  }
];

const accessoryCatalog = [
  { name: "Tai nghe AirPods 2", brand: "Apple", type: "audio", basePrice: 2490000 },
  { name: "Tai nghe AirPods 3", brand: "Apple", type: "audio", basePrice: 3790000 },
  { name: "Tai nghe AirPods Pro 2 USB-C", brand: "Apple", type: "audio", basePrice: 4990000 },
  { name: "Tai nghe JBL Tune 520BT", brand: "JBL", type: "audio", basePrice: 1190000 },
  { name: "Tai nghe Bluetooth Samsung Galaxy Buds FE", brand: "Samsung", type: "audio", basePrice: 1490000 },
  { name: "Củ sạc nhanh Anker 20W USB-C", brand: "Anker", type: "charger", basePrice: 390000 },
  { name: "Củ sạc nhanh Anker 30W USB-C", brand: "Anker", type: "charger", basePrice: 690000 },
  { name: "Cáp sạc Type-C to Type-C Baseus 100W", brand: "Baseus", type: "charger", basePrice: 290000 },
  { name: "Cáp sạc Lightning Apple 1m", brand: "Apple", type: "charger", basePrice: 490000 },
  { name: "Đế sạc không dây Samsung 15W", brand: "Samsung", type: "charger", basePrice: 790000 },
  { name: "Apple Pencil USB-C", brand: "Apple", type: "input", basePrice: 2190000 },
  { name: "Apple Pencil Gen 2", brand: "Apple", type: "input", basePrice: 2990000 },
  { name: "Bàn phím Bluetooth cho iPad", brand: "Baseus", type: "input", basePrice: 1290000 },
  { name: "Bao da bàn phím Galaxy Tab S9 FE", brand: "Samsung", type: "input", basePrice: 1590000 },
  { name: "Ốp lưng MagSafe cho iPhone 15", brand: "Apple", type: "case", basePrice: 690000 },
  { name: "Bao da iPad Air 11 inch", brand: "Apple", type: "case", basePrice: 790000 },
  { name: "Ốp chống sốc Galaxy S24 Ultra", brand: "Samsung", type: "case", basePrice: 390000 },
  { name: "Bao da Xiaomi Pad 6", brand: "Xiaomi", type: "case", basePrice: 450000 },
  { name: "Pin sạc dự phòng Anker 10000mAh", brand: "Anker", type: "charger", basePrice: 890000 },
  { name: "Pin sạc dự phòng Baseus 20000mAh", brand: "Baseus", type: "charger", basePrice: 1090000 }
];

function buildPhoneProducts() {
  return phoneSeries.flatMap((series) =>
    series.storages.flatMap((storage, storageIndex) =>
      series.conditions.map((condition, conditionIndex) => {
        const meta = conditionMeta[condition];
        const color = series.colors[(storageIndex + conditionIndex) % series.colors.length];
        const storageDelta = storage === "512GB" ? 2500000 : storage === "256GB" ? 1200000 : 0;
        const stockBase = condition === "new" ? 5 : condition === "used_99" ? 3 : 2;

        return {
          name: `${series.name} ${storage}`,
          brand: series.brand,
          category: "phone",
          price: series.basePrice + storageDelta + meta.priceDelta,
          stock: stockBase + (storageIndex % 2),
          condition,
          images: [getCatalogImage(series.name)],
          description: `${meta.label}, phù hợp khách cần ${series.brand} để học tập, làm việc và giải trí hằng ngày.`,
          usedDetails: {
            color,
            batteryHealth: meta.batteryHealth,
            warranty: meta.warranty,
            screenStatus: meta.screenStatus,
            bodyStatus: meta.bodyStatus,
            faceIdStatus:
              series.brand === "Apple"
                ? "Face ID / Touch ID hoạt động bình thường"
                : "Vân tay / nhận diện khuôn mặt hoạt động ổn định",
            accessories: condition === "new" ? "Fullbox" : "Máy trần + cáp sạc",
            repairHistory: meta.repairHistory,
            note: `Phiên bản ${storage}, màu ${color}, phù hợp nhu cầu sử dụng thực tế tại cửa hàng.`
          },
          specs: {
            screen: series.specs.screen,
            chip: series.specs.chip,
            ram: series.specs.ram,
            storage,
            battery: series.specs.battery,
            camera: series.specs.camera
          }
        };
      })
    )
  );
}

function buildTabletProducts() {
  return tabletSeries.flatMap((series) =>
    series.storages.flatMap((storage, storageIndex) =>
      series.conditions.map((condition, conditionIndex) => {
        const meta = conditionMeta[condition];
        const color = series.colors[(storageIndex + conditionIndex) % series.colors.length];
        const storageDelta = storage === "512GB" ? 3000000 : storage === "256GB" ? 1500000 : 0;
        const stockBase = condition === "new" ? 4 : 2;

        return {
          name: `${series.name} ${storage}`,
          brand: series.brand,
          category: "tablet",
          price: series.basePrice + storageDelta + meta.priceDelta,
          stock: stockBase + (conditionIndex % 2),
          condition,
          images: [getCatalogImage(series.name)],
          description: `${meta.label}, phù hợp học tập, xem phim, ghi chú và làm việc trên màn hình lớn.`,
          usedDetails: {
            color,
            batteryHealth: meta.batteryHealth,
            warranty: meta.warranty,
            screenStatus: meta.screenStatus,
            bodyStatus: meta.bodyStatus,
            faceIdStatus:
              series.brand === "Apple"
                ? "Touch ID hoạt động bình thường"
                : "Mở khóa khuôn mặt hoạt động ổn định",
            accessories: condition === "new" ? "Fullbox" : "Máy trần + cáp sạc",
            repairHistory: meta.repairHistory,
            note: `Phiên bản ${storage}, màu ${color}, phù hợp khách cần tablet thực dụng và bền bỉ.`
          },
          specs: {
            screen: series.specs.screen,
            chip: series.specs.chip,
            ram: series.specs.ram,
            storage,
            battery: series.specs.battery,
            camera: series.specs.camera
          }
        };
      })
    )
  );
}

function buildAccessoryProducts() {
  return accessoryCatalog.map((item, index) => {
    const condition = index % 5 === 0 ? "used_99" : "new";
    const meta = conditionMeta[condition];
    const colorOptions = ["Trắng", "Đen", "Xám", "Xanh"];

    return {
      name: item.name,
      brand: item.brand,
      category: "accessory",
      price: item.basePrice + (condition === "used_99" ? -150000 : 0),
      stock: 4 + (index % 6),
      condition,
      images: [getCatalogImage(item.name)],
      description: buildAccessoryDescription(item.type),
      usedDetails: {
        color: colorOptions[index % colorOptions.length],
        batteryHealth: item.type === "audio" ? meta.batteryHealth : "",
        warranty: condition === "new" ? "Bảo hành 12 tháng" : "Bảo hành 1 tháng",
        screenStatus: "",
        bodyStatus: condition === "new" ? "Phụ kiện mới" : "Ngoại hình đẹp, hoạt động tốt",
        faceIdStatus: "",
        accessories: condition === "new" ? "Fullbox" : "Phụ kiện rời",
        repairHistory: "Chưa sửa chữa",
        note: buildAccessoryNote(item.type)
      },
      specs: {
        screen: "",
        chip: item.type === "audio" ? "Chip âm thanh tối ưu kết nối" : "",
        ram: "",
        storage: "",
        battery:
          item.type === "audio"
            ? "Thời lượng pin ổn định"
            : item.type === "charger"
              ? "Công suất sạc tối ưu"
              : "",
        camera: ""
      }
    };
  });
}

function buildAccessoryDescription(type) {
  if (type === "audio") {
    return "Tai nghe phù hợp nghe nhạc, gọi điện và học online, kết nối ổn định với điện thoại và máy tính bảng.";
  }

  if (type === "charger") {
    return "Phụ kiện sạc / cáp phù hợp sạc nhanh điện thoại, máy tính bảng và thiết bị công nghệ hằng ngày.";
  }

  if (type === "input") {
    return "Bút cảm ứng hoặc bàn phím phù hợp học tập, ghi chú và làm việc trên tablet.";
  }

  return "Ốp lưng hoặc bao da giúp bảo vệ máy tốt hơn, phù hợp sử dụng hằng ngày tại cửa hàng.";
}

function buildAccessoryNote(type) {
  if (type === "audio") {
    return "Phù hợp khách cần tai nghe chính hãng để dùng hằng ngày.";
  }

  if (type === "charger") {
    return "Phù hợp khách cần sạc nhanh, cáp bền và dễ bán tại cửa hàng.";
  }

  if (type === "input") {
    return "Phù hợp khách dùng tablet để ghi chú, học tập và làm việc.";
  }

  return "Phù hợp khách cần phụ kiện bảo vệ máy và dễ tư vấn tại shop.";
}

const sampleProducts = [
  ...buildPhoneProducts(),
  ...buildTabletProducts(),
  ...buildAccessoryProducts()
];

async function seedDatabase() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing in .env");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Đã kết nối MongoDB");

    await Promise.all([Product.deleteMany({}), User.deleteMany({})]);
    console.log("Đã xóa dữ liệu demo cũ");

    await Product.insertMany(sampleProducts);

    for (const user of demoUsers) {
      await User.create(user);
    }

    console.log("Đã thêm dữ liệu demo thành công");
    console.log(`Tổng sản phẩm demo: ${sampleProducts.length}`);
    console.log(`Tổng tài khoản demo: ${demoUsers.length}`);
    console.log("Admin account: admin@example.com / admin123");
    console.log("User account: user@example.com / user123");
  } catch (error) {
    console.error("Lỗi seed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log("Đã đóng kết nối MongoDB");
  }
}

seedDatabase();
