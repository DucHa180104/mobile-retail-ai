import express from "express";
import mongoose from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import Product from "../models/Product.js";
import productRoutes from "./productRoutes.js";

const app = express();
app.use(express.json());
app.use("/api/products", productRoutes);

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

beforeEach(async () => {
  await Product.deleteMany({});

  await Product.create([
    {
      name: "iPhone 12 128GB",
      brand: "Apple",
      price: 10000000,
      stock: 5
    },
    {
      name: "Samsung Galaxy S23",
      brand: "Samsung",
      price: 15000000,
      stock: 3
    },
    {
      name: "Regex (a+)+$ Test",
      brand: "SpecialBrand",
      price: 9000000,
      stock: 2
    }
  ]);
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe("S8 - Keyword regex injection protection", () => {
  it("should still search correctly with a normal keyword", async () => {
    const response = await request(app).get("/api/products?keyword=iphone");

    expect(response.status).toBe(200);
    expect(response.body.products).toHaveLength(1);
    expect(response.body.products[0].name).toBe("iPhone 12 128GB");
  });

  it("should treat regex special characters as plain text", async () => {
    const response = await request(app).get(
      `/api/products?keyword=${encodeURIComponent("(a+)+$")}`
    );

    expect(response.status).toBe(200);
    expect(response.body.products).toHaveLength(1);
    expect(response.body.products[0].name).toBe("Regex (a+)+$ Test");
  });

  it("should safely handle an overly long keyword", async () => {
    const longKeyword = `iphone${"a".repeat(300)}`;
    const response = await request(app).get(
      `/api/products?keyword=${encodeURIComponent(longKeyword)}`
    );

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.products)).toBe(true);
    expect(response.body.products).toHaveLength(0);
  });
});
