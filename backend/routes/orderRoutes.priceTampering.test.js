import express from "express";
import mongoose from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import orderRoutes from "./orderRoutes.js";

const app = express();
app.use(express.json());
app.use("/api/orders", orderRoutes);

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

beforeEach(async () => {
  await Order.deleteMany({});
  await Product.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe("S2 - Price tampering protection", () => {
  it("should ignore fake client price and totalAmount, then save the real database price", async () => {
    const product = await Product.create({
      name: "iPhone 12 Test",
      brand: "Apple",
      price: 10000000,
      stock: 5,
      images: ["https://example.com/iphone12.jpg"]
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
        paymentMethod: "cod",
        items: [
          {
            productId: String(product._id),
            name: "iPhone Fake Name",
            price: 1000,
            quantity: 2,
            image: "https://fake-image.example.com/fake.jpg"
          }
        ],
        totalAmount: 2000
      });

    expect(response.status).toBe(201);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0].name).toBe("iPhone 12 Test");
    expect(response.body.items[0].price).toBe(10000000);
    expect(response.body.items[0].quantity).toBe(2);
    expect(response.body.items[0].image).toBe("https://example.com/iphone12.jpg");
    expect(response.body.totalAmount).toBe(20000000);

    const savedOrder = await Order.findById(response.body._id);
    expect(savedOrder.items[0].price).toBe(10000000);
    expect(savedOrder.totalAmount).toBe(20000000);
  });

  it("should return 400 when item quantity is less than 1", async () => {
    const product = await Product.create({
      name: "iPhone 13 Test",
      brand: "Apple",
      price: 12000000,
      stock: 3
    });

    const response = await request(app)
      .post("/api/orders")
      .send({
        contactEmail: "khach@example.com",
        shippingInfo: {
          fullName: "Khach Test",
          phoneNumber: "0900000000",
          address: "123 Duong Test"
        },
        paymentMethod: "cod",
        items: [
          {
            productId: String(product._id),
            price: 1,
            quantity: 0
          }
        ],
        totalAmount: 1
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Item quantity must be at least 1");
  });
});
