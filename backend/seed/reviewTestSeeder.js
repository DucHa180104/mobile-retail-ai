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

function buildShippingInfo(index, userName) {
  return {
    fullName: userName,
    phoneNumber: `090000000${index + 1}`,
    address: `${100 + index} Duong Test Review`,
    city: "TP.HCM",
    district: "Quan 10",
    ward: `Phuong ${index + 1}`,
    note: "Don test review tu dong"
  };
}

function buildOrderItem(product) {
  return {
    productId: product._id,
    name: product.name,
    price: product.price,
    quantity: 1,
    image: product.images?.[0] || ""
  };
}

async function seedReviewTestData() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing in .env");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const products = await Product.find().sort({ createdAt: -1 }).limit(8);

    if (products.length < 4) {
      throw new Error("Need at least 4 products in database before seeding review test users");
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

    for (let index = 0; index < createdUsers.length; index += 1) {
      const user = createdUsers[index];
      const primaryProduct = products[index];
      const secondaryProduct = products[(index + 1) % products.length];
      const items = [buildOrderItem(primaryProduct)];

      if (secondaryProduct && String(secondaryProduct._id) !== String(primaryProduct._id)) {
        items.push(buildOrderItem(secondaryProduct));
      }

      const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const shippingInfo = buildShippingInfo(index, user.name);

      const order = await Order.create({
        user: user._id,
        shippingInfo,
        customerName: shippingInfo.fullName,
        phoneNumber: shippingInfo.phoneNumber,
        address: shippingInfo.address,
        note: shippingInfo.note,
        items,
        totalAmount,
        paymentMethod: index % 2 === 0 ? "cod" : "online_mock",
        paymentStatus: index % 2 === 0 ? "unpaid" : "paid",
        paidAt: index % 2 === 0 ? null : new Date(),
        transactionId: index % 2 === 0 ? "" : `REVIEW-TEST-${Date.now()}-${index}`,
        status: "confirmed"
      });

      createdOrders.push(order);
    }

    console.log("Seeded 4 review test users and confirmed orders successfully");
    console.log("Tai khoan test:");
    reviewTestUsers.forEach((user, index) => {
      const order = createdOrders[index];
      const productNames = order.items.map((item) => item.name).join(" | ");
      console.log(
        `- ${user.email} / ${user.password} -> Order ${String(order._id).slice(-8).toUpperCase()} -> ${productNames}`
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
