import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import User from "../models/User.js";
import authRoutes from "./authRoutes.js";
import { errorHandler } from "../middleware/errorHandler.js";

const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use(errorHandler);

let mongoServer;

beforeAll(async () => {
  process.env.JWT_SECRET = "test_jwt_secret";
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

beforeEach(async () => {
  await User.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe("P1.5 - Profile update should not erase existing shipping info", () => {
  it("should keep old shipping fields when request only updates one field", async () => {
    const user = await User.create({
      name: "Profile Test",
      email: "profile-test@example.com",
      password: "123456",
      shippingInfo: {
        fullName: "Nguyen Van A",
        phoneNumber: "0900000001",
        address: "12 Nguyen Trai",
        city: "TPHCM",
        district: "Quan 1",
        ward: "Ben Nghe",
        note: "Giao gio hanh chinh"
      }
    });

    const token = jwt.sign({ userId: String(user._id) }, process.env.JWT_SECRET, {
      expiresIn: "1h"
    });

    const response = await request(app)
      .put("/api/auth/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({
        shippingInfo: {
          fullName: "Nguyen Van B"
        }
      });

    expect(response.status).toBe(200);
    expect(response.body.user.shippingInfo.fullName).toBe("Nguyen Van B");
    expect(response.body.user.shippingInfo.phoneNumber).toBe("0900000001");
    expect(response.body.user.shippingInfo.address).toBe("12 Nguyen Trai");
    expect(response.body.user.shippingInfo.city).toBe("TPHCM");
    expect(response.body.user.shippingInfo.district).toBe("Quan 1");
    expect(response.body.user.shippingInfo.ward).toBe("Ben Nghe");
    expect(response.body.user.shippingInfo.note).toBe("Giao gio hanh chinh");

    const savedUser = await User.findById(user._id);
    expect(savedUser.shippingInfo.fullName).toBe("Nguyen Van B");
    expect(savedUser.shippingInfo.phoneNumber).toBe("0900000001");
    expect(savedUser.shippingInfo.address).toBe("12 Nguyen Trai");
    expect(savedUser.shippingInfo.city).toBe("TPHCM");
    expect(savedUser.shippingInfo.district).toBe("Quan 1");
    expect(savedUser.shippingInfo.ward).toBe("Ben Nghe");
    expect(savedUser.shippingInfo.note).toBe("Giao gio hanh chinh");
  });

  it("should still allow clearing a field when client explicitly sends an empty string", async () => {
    const user = await User.create({
      name: "Profile Note Test",
      email: "profile-note@example.com",
      password: "123456",
      shippingInfo: {
        fullName: "Nguyen Van C",
        phoneNumber: "0900000002",
        address: "34 Le Loi",
        city: "Da Nang",
        district: "Hai Chau",
        ward: "Thach Thang",
        note: "Giao cho le tan"
      }
    });

    const token = jwt.sign({ userId: String(user._id) }, process.env.JWT_SECRET, {
      expiresIn: "1h"
    });

    const response = await request(app)
      .put("/api/auth/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({
        shippingInfo: {
          note: ""
        }
      });

    expect(response.status).toBe(200);
    expect(response.body.user.shippingInfo.fullName).toBe("Nguyen Van C");
    expect(response.body.user.shippingInfo.note).toBe("");

    const savedUser = await User.findById(user._id);
    expect(savedUser.shippingInfo.fullName).toBe("Nguyen Van C");
    expect(savedUser.shippingInfo.address).toBe("34 Le Loi");
    expect(savedUser.shippingInfo.note).toBe("");
  });
});
