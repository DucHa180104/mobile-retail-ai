import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import Product from "../models/Product.js";
import User from "../models/User.js";
import productRoutes from "./productRoutes.js";

const app = express();
app.use(express.json());
app.use("/api/products", productRoutes);

let mongoServer;

beforeAll(async () => {
  process.env.JWT_SECRET = "test_jwt_secret";
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

beforeEach(async () => {
  await User.deleteMany({});
  await Product.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe("S5 - Product mass assignment protection", () => {
  it("should ignore unexpected top-level fields when creating a product", async () => {
    const admin = await createAdminUser();

    const response = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${generateToken(admin._id)}`)
      .send({
        name: "iPhone 12 Test",
        brand: "Apple",
        price: 10000000,
        stock: 5,
        condition: "used_99",
        images: ["https://example.com/iphone12.jpg"],
        description: "May test",
        role: "admin",
        randomField: "should be ignored",
        createdAt: "2000-01-01T00:00:00.000Z"
      });

    expect(response.status).toBe(201);
    expect(response.body.name).toBe("iPhone 12 Test");
    expect(response.body.role).toBeUndefined();
    expect(response.body.randomField).toBeUndefined();

    const savedProduct = await Product.findById(response.body._id).lean();
    expect(savedProduct.name).toBe("iPhone 12 Test");
    expect(savedProduct.role).toBeUndefined();
    expect(savedProduct.randomField).toBeUndefined();
    expect(new Date(savedProduct.createdAt).getFullYear()).not.toBe(2000);
  });

  it("should ignore unexpected nested fields when creating a product", async () => {
    const admin = await createAdminUser();

    const response = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${generateToken(admin._id)}`)
      .send({
        name: "iPhone 13 Test",
        brand: "Apple",
        price: 12000000,
        stock: 3,
        usedDetails: {
          color: "Den",
          batteryHealth: "89%",
          hackField: "should be ignored"
        },
        specs: {
          storage: "128GB",
          camera: "12MP",
          unknownSpec: "should be ignored"
        }
      });

    expect(response.status).toBe(201);
    expect(response.body.usedDetails.color).toBe("Den");
    expect(response.body.usedDetails.batteryHealth).toBe("89%");
    expect(response.body.usedDetails.hackField).toBeUndefined();
    expect(response.body.specs.storage).toBe("128GB");
    expect(response.body.specs.camera).toBe("12MP");
    expect(response.body.specs.unknownSpec).toBeUndefined();
  });

  it("should update only allowed fields and ignore unexpected fields", async () => {
    const admin = await createAdminUser();
    const product = await Product.create({
      name: "iPhone 14 Test",
      brand: "Apple",
      price: 15000000,
      stock: 4,
      condition: "used_good",
      description: "Ban dau",
      usedDetails: {
        color: "Trang"
      },
      specs: {
        storage: "256GB"
      }
    });

    const response = await request(app)
      .put(`/api/products/${product._id}`)
      .set("Authorization", `Bearer ${generateToken(admin._id)}`)
      .send({
        price: 14000000,
        randomField: "should be ignored",
        usedDetails: {
          color: "Tim",
          injectedField: "should be ignored"
        },
        specs: {
          storage: "512GB",
          unsafeSpec: "should be ignored"
        }
      });

    expect(response.status).toBe(200);
    expect(response.body.price).toBe(14000000);
    expect(response.body.randomField).toBeUndefined();
    expect(response.body.usedDetails.color).toBe("Tim");
    expect(response.body.usedDetails.injectedField).toBeUndefined();
    expect(response.body.specs.storage).toBe("512GB");
    expect(response.body.specs.unsafeSpec).toBeUndefined();

    const updatedProduct = await Product.findById(product._id).lean();
    expect(updatedProduct.price).toBe(14000000);
    expect(updatedProduct.randomField).toBeUndefined();
    expect(updatedProduct.usedDetails.color).toBe("Tim");
    expect(updatedProduct.usedDetails.injectedField).toBeUndefined();
    expect(updatedProduct.specs.storage).toBe("512GB");
    expect(updatedProduct.specs.unsafeSpec).toBeUndefined();
    expect(updatedProduct.name).toBe("iPhone 14 Test");
  });
});

function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "1h" });
}

async function createAdminUser() {
  return User.create({
    name: "Admin User",
    email: `admin-${Date.now()}-${Math.random()}@example.com`,
    password: "123456",
    role: "admin"
  });
}
