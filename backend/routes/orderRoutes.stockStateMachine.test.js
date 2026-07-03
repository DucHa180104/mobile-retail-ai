import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import orderRoutes from "./orderRoutes.js";

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
  await User.deleteMany({});
  await Order.deleteMany({});
  await Product.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe("P0 - Order stock rollback and state machine", () => {
  it("should restore product stock when admin cancels a pending order", async () => {
    const admin = await createUser({
      name: "Admin Demo",
      email: "admin-demo@example.com",
      role: "admin"
    });
    const product = await Product.create({
      name: "iPhone 13 128GB",
      brand: "Apple",
      price: 12000000,
      stock: 5
    });

    const createdOrderResponse = await request(app)
      .post("/api/orders")
      .send({
        contactEmail: "khach@example.com",
        shippingInfo: {
          fullName: "Khach Test",
          phoneNumber: "0900000000",
          address: "123 Duong Test",
          city: "TPHCM",
          district: "Quan 1",
          ward: "Phuong 1",
          note: ""
        },
        items: [
          {
            productId: String(product._id),
            quantity: 2
          }
        ]
      });

    expect(createdOrderResponse.status).toBe(201);

    const productAfterCreate = await Product.findById(product._id);
    expect(productAfterCreate.stock).toBe(3);

    const cancelResponse = await request(app)
      .patch(`/api/orders/${createdOrderResponse.body._id}/status`)
      .set("Authorization", `Bearer ${generateToken(admin._id)}`)
      .send({ status: "cancelled" });

    expect(cancelResponse.status).toBe(200);
    expect(cancelResponse.body.status).toBe("cancelled");

    const productAfterCancel = await Product.findById(product._id);
    expect(productAfterCancel.stock).toBe(5);
  });

  it("should block invalid transition from cancelled back to confirmed", async () => {
    const admin = await createUser({
      name: "Admin Demo",
      email: "admin-transition@example.com",
      role: "admin"
    });
    const product = await Product.create({
      name: "iPhone 14 128GB",
      brand: "Apple",
      price: 15000000,
      stock: 4
    });
    const order = await Order.create({
      customerName: "Khach Test",
      contactEmail: "khach@example.com",
      phoneNumber: "0900000000",
      address: "123 Duong Test",
      shippingInfo: {
        fullName: "Khach Test",
        phoneNumber: "0900000000",
        address: "123 Duong Test",
        city: "TPHCM",
        district: "Quan 1",
        ward: "Phuong 1",
        note: ""
      },
      items: [
        {
          productId: product._id,
          name: product.name,
          price: product.price,
          quantity: 1,
          image: ""
        }
      ],
      totalAmount: product.price,
      status: "cancelled"
    });

    const response = await request(app)
      .patch(`/api/orders/${order._id}/status`)
      .set("Authorization", `Bearer ${generateToken(admin._id)}`)
      .send({ status: "confirmed" });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("Khong the chuyen trang thai don hang");
  });

  it("should rollback the whole order when one product does not have enough stock", async () => {
    const productA = await Product.create({
      name: "iPhone 12 64GB",
      brand: "Apple",
      price: 9000000,
      stock: 3
    });
    const productB = await Product.create({
      name: "iPhone 12 128GB",
      brand: "Apple",
      price: 10000000,
      stock: 0
    });

    const response = await request(app)
      .post("/api/orders")
      .send({
        contactEmail: "khach@example.com",
        shippingInfo: {
          fullName: "Khach Test",
          phoneNumber: "0900000000",
          address: "123 Duong Test",
          city: "TPHCM",
          district: "Quan 1",
          ward: "Phuong 1",
          note: ""
        },
        items: [
          {
            productId: String(productA._id),
            quantity: 1
          },
          {
            productId: String(productB._id),
            quantity: 1
          }
        ]
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("iPhone 12 128GB khong du hang trong kho");

    const productAAfterFail = await Product.findById(productA._id);
    const productBAfterFail = await Product.findById(productB._id);
    const totalOrders = await Order.countDocuments();

    expect(productAAfterFail.stock).toBe(3);
    expect(productBAfterFail.stock).toBe(0);
    expect(totalOrders).toBe(0);
  });
});

function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "1h" });
}

async function createUser({ name, email, role }) {
  return User.create({
    name,
    email,
    password: "123456",
    role
  });
}
