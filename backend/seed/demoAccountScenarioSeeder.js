import dotenv from "dotenv";
import mongoose from "mongoose";
import ChatHistory from "../models/ChatHistory.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Review from "../models/Review.js";
import SupportConversation from "../models/SupportConversation.js";
import SupportMessage from "../models/SupportMessage.js";
import User from "../models/User.js";

dotenv.config();

const adminSeed = {
  name: "Nguyễn Mạnh Hùng",
  email: "admin@example.com",
  password: "admin123",
  role: "admin",
  phoneNumber: "0988123456",
  shippingInfo: {
    fullName: "Cửa hàng Mạnh Hướng",
    phoneNumber: "0988123456",
    address: "123 Lê Đại Hành",
    city: "Bắc Ninh",
    district: "Từ Sơn",
    ward: "Đông Ngàn",
    note: "Tài khoản quản trị demo"
  }
};

const demoCustomers = [
  {
    name: "Nguyễn Văn Duy",
    email: "duy.nguyen.tuson@example.com",
    password: "demo123",
    role: "user",
    phoneNumber: "0912345678",
    shippingInfo: {
      fullName: "Nguyễn Văn Duy",
      phoneNumber: "0912345678",
      address: "Số 18 đường Lý Thái Tổ",
      city: "Bắc Ninh",
      district: "Từ Sơn",
      ward: "Đình Bảng",
      note: "Nhận hàng giờ hành chính"
    }
  },
  {
    name: "Trần Thu Hà",
    email: "ha.tran.dongky@example.com",
    password: "demo123",
    role: "user",
    phoneNumber: "0912456789",
    shippingInfo: {
      fullName: "Trần Thu Hà",
      phoneNumber: "0912456789",
      address: "Số 42 phố Chợ Đồng Kỵ",
      city: "Bắc Ninh",
      district: "Từ Sơn",
      ward: "Đồng Kỵ",
      note: "Gọi trước khi giao"
    }
  },
  {
    name: "Phạm Minh Quân",
    email: "quan.pham.trangha@example.com",
    password: "demo123",
    role: "user",
    phoneNumber: "0912567890",
    shippingInfo: {
      fullName: "Phạm Minh Quân",
      phoneNumber: "0912567890",
      address: "Ngõ 7 khu phố Trang Hạ",
      city: "Bắc Ninh",
      district: "Từ Sơn",
      ward: "Trang Hạ",
      note: "Ship buổi tối sau 18h"
    }
  },
  {
    name: "Lê Thị Mai",
    email: "mai.le.chaukhe@example.com",
    password: "demo123",
    role: "user",
    phoneNumber: "0912678901",
    shippingInfo: {
      fullName: "Lê Thị Mai",
      phoneNumber: "0912678901",
      address: "Số 9 đường Trần Phú",
      city: "Bắc Ninh",
      district: "Từ Sơn",
      ward: "Châu Khê",
      note: "Nhà có cửa màu xanh"
    }
  },
  {
    name: "Đỗ Gia Huy",
    email: "huy.do.phukhe@example.com",
    password: "demo123",
    role: "user",
    phoneNumber: "0912789012",
    shippingInfo: {
      fullName: "Đỗ Gia Huy",
      phoneNumber: "0912789012",
      address: "Số 55 đường Nguyễn Văn Cừ",
      city: "Bắc Ninh",
      district: "Từ Sơn",
      ward: "Phù Khê",
      note: "Liên hệ qua số phụ nếu không nghe máy"
    }
  }
];

function buildOrderItem(product, quantity = 1) {
  return {
    productId: product._id,
    name: product.name,
    price: product.price,
    quantity,
    image: product.images?.[0] || ""
  };
}

function buildTotalAmount(items) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function makeDate(daysAgo, hour = 9, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, minute, 0, 0);
  return date;
}

async function upsertUser(userData) {
  const existingUser = await User.findOne({ email: userData.email });

  if (!existingUser) {
    return User.create(userData);
  }

  existingUser.name = userData.name;
  existingUser.role = userData.role;
  existingUser.password = userData.password;
  existingUser.phoneNumber = userData.phoneNumber;
  existingUser.shippingInfo = userData.shippingInfo;
  existingUser.isActive = true;
  existingUser.banReason = "";
  existingUser.bannedAt = null;
  existingUser.bannedBy = null;
  await existingUser.save();
  return existingUser;
}

async function findProductByKeyword(keyword) {
  return Product.findOne({
    name: { $regex: keyword, $options: "i" }
  }).sort({ price: 1 });
}

async function loadScenarioProducts() {
  const productMap = {
    iphone12: await findProductByKeyword("iPhone 12"),
    iphone13: await findProductByKeyword("iPhone 13"),
    iphone14: await findProductByKeyword("iPhone 14"),
    iphone15: await findProductByKeyword("iPhone 15"),
    samsungA55: await findProductByKeyword("Galaxy A55"),
    samsungS24: await findProductByKeyword("Galaxy S24 Ultra"),
    xiaomi14: await findProductByKeyword("Xiaomi 14"),
    ipadGen10: await findProductByKeyword("iPad Gen 10"),
    ipadAirM2: await findProductByKeyword("iPad Air M2"),
    tabS9fe: await findProductByKeyword("Tab S9 FE"),
    airpodsPro: await findProductByKeyword("AirPods Pro 2"),
    anker20w: await findProductByKeyword("Anker 20W"),
    pencilUsbC: await findProductByKeyword("Apple Pencil USB-C")
  };

  const missing = Object.entries(productMap)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Thiếu sản phẩm để seed demo: ${missing.join(", ")}`);
  }

  return productMap;
}

async function createOrdersForUsers(users, products) {
  const createdOrders = {};

  const orderPlans = [
    {
      email: "duy.nguyen.tuson@example.com",
      orders: [
        {
          createdAt: makeDate(18, 10, 15),
          status: "confirmed",
          paymentMethod: "bank_transfer",
          paymentStatus: "paid",
          paidAt: makeDate(18, 10, 40),
          transactionId: "TS-DUY-001",
          note: "Khách ưu tiên máy pin tốt, giao tận nhà",
          items: [
            buildOrderItem(products.iphone13, 1),
            buildOrderItem(products.airpodsPro, 1)
          ]
        },
        {
          createdAt: makeDate(5, 14, 20),
          status: "pending",
          paymentMethod: "cod",
          paymentStatus: "unpaid",
          paidAt: null,
          transactionId: "",
          note: "Chờ xác nhận lại màu máy",
          items: [buildOrderItem(products.ipadGen10, 1)]
        }
      ]
    },
    {
      email: "ha.tran.dongky@example.com",
      orders: [
        {
          createdAt: makeDate(14, 9, 5),
          status: "confirmed",
          paymentMethod: "online_mock",
          paymentStatus: "paid",
          paidAt: makeDate(14, 9, 7),
          transactionId: "TS-HA-002",
          note: "Đặt mua máy mới cho công việc",
          items: [buildOrderItem(products.iphone15, 1)]
        },
        {
          createdAt: makeDate(3, 19, 10),
          status: "cancelled",
          paymentMethod: "cod",
          paymentStatus: "unpaid",
          paidAt: null,
          transactionId: "",
          note: "Khách đổi sang model khác nên hủy",
          items: [buildOrderItem(products.samsungA55, 1)]
        }
      ]
    },
    {
      email: "quan.pham.trangha@example.com",
      orders: [
        {
          createdAt: makeDate(21, 16, 0),
          status: "confirmed",
          paymentMethod: "bank_transfer",
          paymentStatus: "paid",
          paidAt: makeDate(21, 16, 25),
          transactionId: "TS-QUAN-003",
          note: "Khách cần tablet học tập cho em gái",
          items: [
            buildOrderItem(products.ipadAirM2, 1),
            buildOrderItem(products.pencilUsbC, 1)
          ]
        }
      ]
    },
    {
      email: "mai.le.chaukhe@example.com",
      orders: [
        {
          createdAt: makeDate(11, 11, 35),
          status: "confirmed",
          paymentMethod: "cod",
          paymentStatus: "unpaid",
          paidAt: null,
          transactionId: "",
          note: "Khách mua máy cũ đẹp để chụp ảnh bán hàng",
          items: [buildOrderItem(products.xiaomi14, 1)]
        },
        {
          createdAt: makeDate(1, 8, 50),
          status: "pending",
          paymentMethod: "bank_transfer",
          paymentStatus: "pending",
          paidAt: null,
          transactionId: "",
          note: "Chờ đối soát chuyển khoản",
          items: [
            buildOrderItem(products.anker20w, 1),
            buildOrderItem(products.tabS9fe, 1)
          ]
        }
      ]
    },
    {
      email: "huy.do.phukhe@example.com",
      orders: [
        {
          createdAt: makeDate(9, 15, 45),
          status: "confirmed",
          paymentMethod: "online_mock",
          paymentStatus: "paid",
          paidAt: makeDate(9, 15, 47),
          transactionId: "TS-HUY-004",
          note: "Khách thích máy cấu hình mạnh, màn đẹp",
          items: [buildOrderItem(products.samsungS24, 1)]
        },
        {
          createdAt: makeDate(2, 20, 10),
          status: "confirmed",
          paymentMethod: "cod",
          paymentStatus: "unpaid",
          paidAt: null,
          transactionId: "",
          note: "Mua thêm máy phụ cho người thân",
          items: [buildOrderItem(products.iphone12, 1)]
        }
      ]
    }
  ];

  for (const plan of orderPlans) {
    const user = users.find((item) => item.email === plan.email);

    if (!user) {
      continue;
    }

    createdOrders[user.email] = [];

    for (const orderData of plan.orders) {
      const order = await Order.create({
        user: user._id,
        contactEmail: user.email,
        shippingInfo: user.shippingInfo,
        customerName: user.shippingInfo.fullName,
        phoneNumber: user.shippingInfo.phoneNumber,
        address: user.shippingInfo.address,
        note: orderData.note,
        items: orderData.items,
        totalAmount: buildTotalAmount(orderData.items),
        paymentMethod: orderData.paymentMethod,
        paymentStatus: orderData.paymentStatus,
        paidAt: orderData.paidAt,
        transactionId: orderData.transactionId,
        status: orderData.status,
        createdAt: orderData.createdAt,
        updatedAt: orderData.createdAt
      });

      createdOrders[user.email].push(order);
    }
  }

  return createdOrders;
}

async function createReviews(users, ordersByEmail) {
  const reviewPlans = [
    {
      email: "duy.nguyen.tuson@example.com",
      orderIndex: 0,
      itemIndex: 0,
      rating: 5,
      comment:
        "Máy đẹp đúng mô tả, pin ổn định, cầm rất chắc tay. Shop tư vấn nhanh và giao hàng đúng hẹn."
    },
    {
      email: "ha.tran.dongky@example.com",
      orderIndex: 0,
      itemIndex: 0,
      rating: 4,
      comment:
        "Máy mới nguyên seal, ngoại hình đẹp. Mình hài lòng, chỉ mong shop cập nhật phụ kiện đi kèm rõ hơn."
    },
    {
      email: "quan.pham.trangha@example.com",
      orderIndex: 0,
      itemIndex: 0,
      rating: 5,
      comment:
        "iPad chạy mượt, học online và ghi chú rất ổn. Nhân viên hỗ trợ chọn bút và dán cường lực khá nhiệt tình."
    },
    {
      email: "mai.le.chaukhe@example.com",
      orderIndex: 0,
      itemIndex: 0,
      rating: 4,
      comment:
        "Camera đẹp, màu máy thực tế ổn hơn ảnh. Máy cũ nhưng dùng mượt, phù hợp bán hàng online."
    }
  ];

  for (const plan of reviewPlans) {
    const user = users.find((item) => item.email === plan.email);
    const order = ordersByEmail[plan.email]?.[plan.orderIndex];
    const productItem = order?.items?.[plan.itemIndex];

    if (!user || !order || !productItem || order.status !== "confirmed") {
      continue;
    }

    await Review.create({
      user: user._id,
      product: productItem.productId,
      order: order._id,
      rating: plan.rating,
      comment: plan.comment,
      images: []
    });
  }
}

async function createSupportChats(adminUser, users) {
  const scripts = {
    "duy.nguyen.tuson@example.com": [
      ["user", "Shop ơi, iPhone 13 pin còn khoảng bao nhiêu phần trăm vậy ạ?"],
      ["admin", "Chào anh Duy, máy iPhone 13 trong đơn của anh pin đang khoảng 88-92% tùy từng máy, bên em sẽ gửi video cụ thể trước khi giao."],
      ["user", "Vâng, shop giữ giúp em màu trắng nhé."]
    ],
    "ha.tran.dongky@example.com": [
      ["user", "Bên mình có hỗ trợ xuất hóa đơn công ty không?"],
      ["admin", "Dạ có chị nhé, chị chỉ cần gửi thông tin công ty khi xác nhận đơn là bên em hỗ trợ xuất hóa đơn điện tử."],
      ["user", "Ok shop, vậy em chốt iPhone 15 màu đen."]
    ],
    "quan.pham.trangha@example.com": [
      ["user", "Em muốn mua iPad học tập, có nên lấy thêm bút không ạ?"],
      ["admin", "Nếu anh cần ghi chú nhiều thì nên lấy thêm Apple Pencil USB-C, bên em đang có sẵn và dùng rất hợp với iPad Air."],
      ["user", "Vậy shop lên đơn cho em cả máy và bút nhé."]
    ]
  };

  for (const user of users) {
    const lines = scripts[user.email];

    if (!lines) {
      continue;
    }

    const conversation = await SupportConversation.create({
      user: user._id,
      status: "open",
      lastMessage: lines[lines.length - 1][1],
      lastMessageAt: makeDate(0, 13, 20),
      lastSenderType: lines[lines.length - 1][0]
    });

    for (let index = 0; index < lines.length; index += 1) {
      const [senderType, content] = lines[index];
      await SupportMessage.create({
        conversation: conversation._id,
        sender: senderType === "admin" ? adminUser._id : user._id,
        senderType,
        content,
        isRead: senderType === "admin"
      });
    }
  }
}

async function createAiChatHistory(users, products) {
  const histories = [
    {
      email: "duy.nguyen.tuson@example.com",
      messages: [
        {
          role: "user",
          text: "Shop có iPhone cũ dưới 12 triệu pin ổn không?",
          currentPath: "/phones",
          currentProductId: ""
        },
        {
          role: "bot",
          text: "Mình gợi ý anh tham khảo iPhone 12 và iPhone 13 bản cũ đẹp, pin ổn, giá đang phù hợp trong tầm này.",
          products: [products.iphone12, products.iphone13]
        }
      ]
    },
    {
      email: "quan.pham.trangha@example.com",
      messages: [
        {
          role: "user",
          text: "Em cần tablet học tập có thể ghi chú tốt.",
          currentPath: "/tablets",
          currentProductId: ""
        },
        {
          role: "bot",
          text: "Nếu ưu tiên ghi chú và học tập, iPad Air M2 và iPad Gen 10 là hai lựa chọn rất phù hợp ở shop hiện tại.",
          products: [products.ipadAirM2, products.ipadGen10]
        }
      ]
    }
  ];

  for (const historyPlan of histories) {
    const user = users.find((item) => item.email === historyPlan.email);

    if (!user) {
      continue;
    }

    await ChatHistory.create({
      user: user._id,
      messages: historyPlan.messages.map((message) => ({
        role: message.role,
        text: message.text,
        currentPath: message.currentPath || "",
        currentProductId: message.currentProductId || "",
        products: (message.products || []).map((product) => ({
          id: String(product._id),
          name: product.name,
          image: product.images?.[0] || "",
          priceText: `${Number(product.price || 0).toLocaleString("vi-VN")} đ`,
          conditionLabel: product.condition || "",
          stock: Number(product.stock || 0),
          stockText: Number(product.stock || 0) > 0 ? `Còn ${product.stock} sản phẩm` : "Tạm hết hàng",
          storage: product.specs?.storage || "",
          batteryHealth: product.usedDetails?.batteryHealth || "",
          path: `/products/${product._id}`
        }))
      }))
    });
  }
}

async function attachWishlistAndCart(users, products) {
  const byEmail = Object.fromEntries(users.map((user) => [user.email, user]));

  if (byEmail["duy.nguyen.tuson@example.com"]) {
    byEmail["duy.nguyen.tuson@example.com"].wishlist = [products.iphone13._id, products.airpodsPro._id];
    byEmail["duy.nguyen.tuson@example.com"].cart = [
      { productId: products.iphone12._id, quantity: 1 }
    ];
    await byEmail["duy.nguyen.tuson@example.com"].save();
  }

  if (byEmail["quan.pham.trangha@example.com"]) {
    byEmail["quan.pham.trangha@example.com"].wishlist = [products.ipadAirM2._id];
    byEmail["quan.pham.trangha@example.com"].cart = [
      { productId: products.pencilUsbC._id, quantity: 1 }
    ];
    await byEmail["quan.pham.trangha@example.com"].save();
  }
}

async function clearOldScenarioData(userIds) {
  const conversations = await SupportConversation.find({ user: { $in: userIds } }).select("_id");
  const conversationIds = conversations.map((item) => item._id);

  await Promise.all([
    Review.deleteMany({ user: { $in: userIds } }),
    Order.deleteMany({ user: { $in: userIds } }),
    ChatHistory.deleteMany({ user: { $in: userIds } }),
    SupportMessage.deleteMany({ conversation: { $in: conversationIds } }),
    SupportConversation.deleteMany({ user: { $in: userIds } })
  ]);
}

async function seedDemoScenario() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing in .env");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Đã kết nối MongoDB");

    const products = await loadScenarioProducts();
    const adminUser = await upsertUser(adminSeed);

    const users = [];
    for (const customer of demoCustomers) {
      const user = await upsertUser(customer);
      users.push(user);
    }

    await clearOldScenarioData(users.map((user) => user._id));
    const ordersByEmail = await createOrdersForUsers(users, products);
    await createReviews(users, ordersByEmail);
    await createSupportChats(adminUser, users);
    await createAiChatHistory(users, products);
    await attachWishlistAndCart(users, products);

    console.log("Seed demo scenario thành công");
    console.log(`Tổng user demo: ${users.length}`);
    console.log("Tài khoản demo:");
    users.forEach((user) => {
      console.log(`- ${user.email} / demo123`);
    });
    console.log("Admin demo:");
    console.log(`- ${adminUser.email} / admin123`);
  } catch (error) {
    console.error("Demo scenario seed error:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log("Đã đóng kết nối MongoDB");
  }
}

seedDemoScenario();
