import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import authRoutes from "./authRoutes.js";
import orderRoutes from "./orderRoutes.js";
import { errorHandler } from "../middleware/errorHandler.js";

vi.mock("../services/emailService.js", () => ({
  sendOrderConfirmationEmail: vi.fn().mockResolvedValue(undefined)
}));

const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use(errorHandler);

let mongoServer;

beforeAll(async () => {
  process.env.JWT_SECRET = "test_jwt_secret";
  mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(mongoServer.getUri());
});

beforeEach(async () => {
  await User.deleteMany({});
  await Product.deleteMany({});
  await Order.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe("P1.6 - Banned account should lose access immediately", () => {
  it("should block a banned user from accessing protected routes even if the token is still valid", async () => {
    const user = await User.create({
      name: "Banned Protected User",
      email: "banned-protected@example.com",
      password: "123456",
      isActive: true
    });

    const token = jwt.sign({ userId: String(user._id) }, process.env.JWT_SECRET, {
      expiresIn: "7d"
    });

    user.isActive = false;
    user.banReason = "Vi pham chinh sach";
    await user.save();

    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Account has been disabled");
  });

  it("should treat banned users as guests on optional-auth order creation", async () => {
    const user = await User.create({
      name: "Banned Optional User",
      email: "banned-optional@example.com",
      password: "123456",
      isActive: true
    });

    const product = await Product.create({
      name: "iPhone 15 Optional Ban Test",
      brand: "Apple",
      price: 20000000,
      stock: 5
    });

    const token = jwt.sign({ userId: String(user._id) }, process.env.JWT_SECRET, {
      expiresIn: "7d"
    });

    user.isActive = false;
    user.banReason = "Bi khoa tai khoan";
    await user.save();

    const response = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({
        contactEmail: "guest-after-ban@example.com",
        shippingInfo: {
          fullName: "Khach Guest Sau Khi Ban",
          phoneNumber: "0900000099",
          address: "123 Duong Guest"
        },
        paymentMethod: "cod",
        items: [
          {
            productId: String(product._id),
            quantity: 1
          }
        ]
      });

    expect(response.status).toBe(201);
    expect(response.body.user).toBeNull();

    const savedOrder = await Order.findById(response.body._id);
    expect(savedOrder).not.toBeNull();
    expect(savedOrder.user).toBeNull();
  });
});
