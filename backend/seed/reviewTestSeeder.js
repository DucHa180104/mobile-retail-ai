import dotenv from "dotenv";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Review from "../models/Review.js";
import User from "../models/User.js";

dotenv.config();

const reviewTestUsers = [
  {
    name: "Khach Review 01",
    email: "review01@example.com",
    password: "review123",
    role: "user"
  },
  {
    name: "Khach Review 02",
    email: "review02@example.com",
    password: "review123",
    role: "user"
  },
  {
    name: "Khach Review 03",
    email: "review03@example.com",
    password: "review123",
    role: "user"
  },
  {
    name: "Khach Review 04",
    email: "review04@example.com",
    password: "review123",
    role: "user"
  }
];

async function upsertReviewTestUser(userData) {
  const existingUser = await User.findOne({ email: userData.email });

  if (!existingUser) {
    return User.create(userData);
  }

  existingUser.name = userData.name;
  existingUser.role = userData.role;
  existingUser.password = userData.password;
  await existingUser.save();
  return existingUser;
}

function buildShippingInfo(index, userName, suffix = "") {
  return {
    fullName: userName,
    phoneNumber: `09000000${String(index + 1).padStart(2, "0")}`,
    address: `${100 + index} Duong Test Review ${suffix}`.trim(),
    city: "TP.HCM",
    district: "Quan 10",
    ward: `Phuong ${index + 1}`,
    note: suffix ? `Don test review ${suffix}` : "Don test review tu dong"
  };
}

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

async function createDiverseOrdersForReview01(user, products) {
  const orderConfigs = [
    {
      suffix: "confirmed-paid",
      itemIndexes: [0, 1],
      quantities: [1, 1],
      paymentMethod: "online_mock",
      paymentStatus: "paid",
      paidAt: new Date(),
      transactionId: `REVIEW01-PAID-${Date.now()}-1`,
      status: "confirmed"
    },
    {
      suffix: "pending-cod",
      itemIndexes: [2],
      quantities: [1],
      paymentMethod: "cod",
      paymentStatus: "unpaid",
      paidAt: null,
      transactionId: "",
      status: "pending"
    },
    {
      suffix: "cancelled-bank",
      itemIndexes: [3, 4],
      quantities: [1, 1],
      paymentMethod: "bank_transfer",
      paymentStatus: "pending",
      paidAt: null,
      transactionId: "",
      status: "cancelled"
    },
    {
      suffix: "confirmed-cod",
      itemIndexes: [5],
      quantities: [2],
      paymentMethod: "cod",
      paymentStatus: "unpaid",
      paidAt: null,
      transactionId: "",
      status: "confirmed"
    },
    {
      suffix: "pending-bank",
      itemIndexes: [6, 7],
      quantities: [1, 1],
      paymentMethod: "bank_transfer",
      paymentStatus: "pending",
      paidAt: null,
      transactionId: "",
      status: "pending"
    }
  ];

  const createdOrders = [];

  for (let index = 0; index < orderConfigs.length; index += 1) {
    const config = orderConfigs[index];
    const items = config.itemIndexes.map((productIndex, itemIndex) =>
      buildOrderItem(products[productIndex], config.quantities[itemIndex] || 1)
    );
    const shippingInfo = buildShippingInfo(index, user.name, config.suffix);

    const order = await Order.create({
      user: user._id,
      shippingInfo,
      customerName: shippingInfo.fullName,
      phoneNumber: shippingInfo.phoneNumber,
      address: shippingInfo.address,
      note: shippingInfo.note,
      items,
      totalAmount: buildTotalAmount(items),
      paymentMethod: config.paymentMethod,
      paymentStatus: config.paymentStatus,
      paidAt: config.paidAt,
      transactionId: config.transactionId,
      status: config.status
    });

    createdOrders.push(order);
  }

  return createdOrders;
}

async function createSingleConfirmedOrder(user, products, index) {
  const primaryProduct = products[index];
  const secondaryProduct = products[(index + 1) % products.length];
  const items = [buildOrderItem(primaryProduct)];

  if (secondaryProduct && String(secondaryProduct._id) !== String(primaryProduct._id)) {
    items.push(buildOrderItem(secondaryProduct));
  }

  const shippingInfo = buildShippingInfo(index + 10, user.name);

  return Order.create({
    user: user._id,
    shippingInfo,
    customerName: shippingInfo.fullName,
    phoneNumber: shippingInfo.phoneNumber,
    address: shippingInfo.address,
    note: shippingInfo.note,
    items,
    totalAmount: buildTotalAmount(items),
    paymentMethod: index % 2 === 0 ? "cod" : "online_mock",
    paymentStatus: index % 2 === 0 ? "unpaid" : "paid",
    paidAt: index % 2 === 0 ? null : new Date(),
    transactionId: index % 2 === 0 ? "" : `REVIEW-TEST-${Date.now()}-${index}`,
    status: "confirmed"
  });
}

async function seedReviewTestData() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing in .env");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const products = await Product.find().sort({ createdAt: -1 }).limit(8);

    if (products.length < 8) {
      throw new Error("Need at least 8 products in database before seeding review test users");
    }

    const createdUsers = [];

    for (const userData of reviewTestUsers) {
      const user = await upsertReviewTestUser(userData);
      createdUsers.push(user);
    }

    const userIds = createdUsers.map((user) => user._id);

    await Review.deleteMany({ user: { $in: userIds } });
    await Order.deleteMany({ user: { $in: userIds } });

    const createdOrders = [];

    const review01Orders = await createDiverseOrdersForReview01(createdUsers[0], products);
    createdOrders.push(...review01Orders);

    for (let index = 1; index < createdUsers.length; index += 1) {
      const order = await createSingleConfirmedOrder(createdUsers[index], products, index);
      createdOrders.push(order);
    }

    console.log("Seeded review test users and diverse orders successfully");
    console.log("Tai khoan can test lich su don hang da duoc bo sung:");
    console.log(`- review01@example.com / review123 -> ${review01Orders.length} don hang`);
    review01Orders.forEach((order, index) => {
      console.log(
        `  ${index + 1}. ${String(order._id).slice(-8).toUpperCase()} | status=${order.status} | payment=${order.paymentStatus}`
      );
    });
  } catch (error) {
    console.error("Review test seed error:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
}

seedReviewTestData();
