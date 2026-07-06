import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import orderRoutes from "./orderRoutes.js";

vi.mock("../services/emailService.js", () => ({
  sendOrderConfirmationEmail: vi.fn().mockResolvedValue(undefined)
}));

const app = express();
app.use(express.json());
app.use("/api/orders", orderRoutes);

let mongoServer;

beforeAll(async () => {
  process.env.JWT_SECRET = "test_jwt_secret";
  mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(mongoServer.getUri());
});

beforeEach(async () => {
  await Order.deleteMany({});
  await Product.deleteMany({});
  await User.deleteMany({});
});

afterEach(() => {
  vi.clearAllMocks();
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe("P1.2 - Guest checkout should not be blocked by stale optional auth token", () => {
  it("should still create a guest order when Authorization contains an expired token", async () => {
    const product = await Product.create({
      name: "iPhone 13 Guest Checkout",
      brand: "Apple",
      price: 15000000,
      stock: 3,
      images: ["https://example.com/iphone13.jpg"]
    });

    const expiredToken = jwt.sign(
      { userId: new mongoose.Types.ObjectId().toString() },
      process.env.JWT_SECRET,
      { expiresIn: -10 }
    );

    const response = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${expiredToken}`)
      .send({
        contactEmail: "guest@example.com",
        shippingInfo: {
          fullName: "Khach Vang Lai",
          phoneNumber: "0900000000",
          address: "123 Duong Guest",
          city: "TPHCM",
          district: "Quan 1",
          ward: "Phuong 1",
          note: ""
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
    expect(response.body.contactEmail).toBe("guest@example.com");
    expect(response.body.user).toBeNull();

    const savedOrder = await Order.findById(response.body._id);
    expect(savedOrder).not.toBeNull();
    expect(savedOrder.user).toBeNull();
    expect(savedOrder.totalAmount).toBe(15000000);

    const updatedProduct = await Product.findById(product._id);
    expect(updatedProduct.stock).toBe(2);
  });

  it("should still attach req.user when optional auth token is valid", async () => {
    const user = await User.create({
      name: "Optional Auth User",
      email: "optional-auth@example.com",
      password: "hashed-password",
      role: "user"
    });

    const product = await Product.create({
      name: "iPhone 14 Logged In Checkout",
      brand: "Apple",
      price: 18000000,
      stock: 4
    });

    const validToken = jwt.sign({ userId: String(user._id) }, process.env.JWT_SECRET, {
      expiresIn: "1h"
    });

    const response = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${validToken}`)
      .send({
        contactEmail: "optional-auth@example.com",
        shippingInfo: {
          fullName: "Optional Auth User",
          phoneNumber: "0911111111",
          address: "456 Duong Test"
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
    expect(String(response.body.user)).toBe(String(user._id));
  });
});
