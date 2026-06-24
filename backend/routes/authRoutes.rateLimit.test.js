import express from "express";
import mongoose from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import User from "../models/User.js";
import authRoutes from "./authRoutes.js";
import { loginRateLimiter } from "../middleware/authRateLimitMiddleware.js";

const app = express();
app.set("trust proxy", 1);
app.use(express.json());
app.use("/api/auth", authRoutes);

let mongoServer;
let ipCounter = 1;

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

describe("S4 - Login brute force protection", () => {
  it("should temporarily lock account after too many failed login attempts", async () => {
    const user = await createUser({
      name: "Rate Limit User",
      email: "ratelimit@example.com",
      password: "123456"
    });

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await loginRequest({
        email: "ratelimit@example.com",
        password: "wrong-password",
        ip: getUniqueIp()
      });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Invalid email or password");
    }

    const lockedUser = await User.findById(user._id);
    expect(lockedUser.failedLoginAttempts).toBe(0);
    expect(lockedUser.lockUntil).not.toBeNull();

    const lockedResponse = await loginRequest({
      email: "ratelimit@example.com",
      password: "123456",
      ip: getUniqueIp()
    });

    expect(lockedResponse.status).toBe(423);
    expect(lockedResponse.body.message).toBe(
      "Tài khoản tạm thời bị khóa do đăng nhập sai quá nhiều lần. Vui lòng thử lại sau."
    );
  });

  it("should return 429 when one IP sends too many login requests", async () => {
    await createUser({
      name: "Spam IP User",
      email: "spamip@example.com",
      password: "123456"
    });

    const spamIp = getUniqueIp();

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await loginRequest({
        email: "spamip@example.com",
        password: "wrong-password",
        ip: spamIp
      });

      expect(response.status).toBe(401);
    }

    const blockedResponse = await loginRequest({
      email: "spamip@example.com",
      password: "wrong-password",
      ip: spamIp
    });

    expect(blockedResponse.status).toBe(429);
    expect(blockedResponse.body.message).toBe(
      "Too many login attempts. Please try again after 1 minute."
    );
  });

  it("should reset failed login counter after a successful login", async () => {
    const user = await createUser({
      name: "Reset Counter User",
      email: "resetcounter@example.com",
      password: "123456"
    });

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const response = await loginRequest({
        email: "resetcounter@example.com",
        password: "wrong-password",
        ip: getUniqueIp()
      });

      expect(response.status).toBe(401);
    }

    let refreshedUser = await User.findById(user._id);
    expect(refreshedUser.failedLoginAttempts).toBe(2);
    expect(refreshedUser.lockUntil).toBeNull();

    const successResponse = await loginRequest({
      email: "resetcounter@example.com",
      password: "123456",
      ip: getUniqueIp()
    });

    expect(successResponse.status).toBe(200);
    expect(successResponse.body.token).toBeTruthy();

    refreshedUser = await User.findById(user._id);
    expect(refreshedUser.failedLoginAttempts).toBe(0);
    expect(refreshedUser.lockUntil).toBeNull();
  });
});

function getUniqueIp() {
  const currentIp = `123.123.123.${ipCounter}`;
  ipCounter += 1;
  return currentIp;
}

async function createUser({ name, email, password }) {
  return User.create({
    name,
    email,
    password,
    role: "user"
  });
}

async function loginRequest({ email, password, ip }) {
  return request(app)
    .post("/api/auth/login")
    .set("X-Forwarded-For", ip)
    .send({ email, password });
}

afterAll(() => {
  if (typeof loginRateLimiter.resetKey === "function") {
    for (let index = 1; index < ipCounter; index += 1) {
      loginRateLimiter.resetKey(`123.123.123.${index}`);
    }
  }
});
