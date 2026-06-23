import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import Order from "../models/Order.js";
import User from "../models/User.js";
import orderRoutes from "./orderRoutes.js";

const app = express();
app.use(express.json());
app.use("/api/orders", orderRoutes);

let mongoServer;

beforeAll(async () => {
  process.env.JWT_SECRET = "test_jwt_secret";
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

beforeEach(async () => {
  await User.deleteMany({});
  await Order.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe("S1 - IDOR order access protection", () => {
  it("should return 401 when requesting order detail without login", async () => {
    const owner = await createUser({
      name: "Owner User",
      email: "owner@example.com",
      role: "user"
    });
    const order = await createOrderForUser(owner._id);

    const response = await request(app).get(`/api/orders/${order._id}`);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Not authorized, token is missing");
  });

  it("should return 403 when user A tries to view user B order", async () => {
    const owner = await createUser({
      name: "Owner User",
      email: "owner@example.com",
      role: "user"
    });
    const otherUser = await createUser({
      name: "Other User",
      email: "other@example.com",
      role: "user"
    });
    const order = await createOrderForUser(owner._id);

    const response = await request(app)
      .get(`/api/orders/${order._id}`)
      .set("Authorization", `Bearer ${generateToken(otherUser._id)}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("You do not have permission to view this order");
  });

  it("should return 200 when owner views their own order", async () => {
    const owner = await createUser({
      name: "Owner User",
      email: "owner@example.com",
      role: "user"
    });
    const order = await createOrderForUser(owner._id);

    const response = await request(app)
      .get(`/api/orders/${order._id}`)
      .set("Authorization", `Bearer ${generateToken(owner._id)}`);

    expect(response.status).toBe(200);
    expect(String(response.body._id)).toBe(String(order._id));
    expect(response.body.customerName).toBe("Khach Test");
  });

  it("should return 200 when admin views any user order", async () => {
    const owner = await createUser({
      name: "Owner User",
      email: "owner@example.com",
      role: "user"
    });
    const admin = await createUser({
      name: "Admin User",
      email: "admin@example.com",
      role: "admin"
    });
    const order = await createOrderForUser(owner._id);

    const response = await request(app)
      .get(`/api/orders/${order._id}`)
      .set("Authorization", `Bearer ${generateToken(admin._id, "admin")}`);

    expect(response.status).toBe(200);
    expect(String(response.body._id)).toBe(String(order._id));
    expect(response.body.contactEmail).toBe("khachtest@example.com");
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

async function createOrderForUser(userId) {
  return Order.create({
    user: userId,
    customerName: "Khach Test",
    contactEmail: "khachtest@example.com",
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
        productId: new mongoose.Types.ObjectId(),
        name: "iPhone Test",
        price: 10000000,
        quantity: 1,
        image: ""
      }
    ],
    totalAmount: 10000000
  });
}
