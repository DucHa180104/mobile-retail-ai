import express from "express";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import Product from "../models/Product.js";
import { errorHandler } from "../middleware/errorHandler.js";
import productRoutes from "./productRoutes.js";

const app = express();
app.use(express.json());
app.use("/api/products", productRoutes);
app.use(errorHandler);

afterEach(() => {
  vi.restoreAllMocks();
});

describe("S6 - Internal error message exposure protection", () => {
  it("should hide internal error details and return a generic 500 message", async () => {
    vi.spyOn(Product, "countDocuments").mockRejectedValue(
      new Error("Mongo internal detail: duplicate key stack trace")
    );

    const response = await request(app).get("/api/products");

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Internal server error");
    expect(JSON.stringify(response.body)).not.toContain("Mongo internal detail");
    expect(JSON.stringify(response.body)).not.toContain("duplicate key");
    expect(JSON.stringify(response.body)).not.toContain("stack trace");
  });
});
