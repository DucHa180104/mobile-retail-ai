import express from "express";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import User from "../models/User.js";
import Review from "../models/Review.js";
import ChatHistory from "../models/ChatHistory.js";
import * as aiChatService from "../services/aiChatService.js";
import { errorHandler } from "../middleware/errorHandler.js";
import { getCart } from "../controllers/cartController.js";
import { getWishlist } from "../controllers/wishlistController.js";
import { getReviews } from "../controllers/reviewController.js";
import { getMyChatHistory, sendChatReply } from "../controllers/chatController.js";

const app = express();

app.use(express.json());

app.use((req, _res, next) => {
  req.user = { _id: "507f1f77bcf86cd799439011" };
  next();
});

app.get("/api/test/cart", getCart);
app.get("/api/test/wishlist", getWishlist);
app.get("/api/test/reviews", getReviews);
app.get("/api/test/chat/history", getMyChatHistory);
app.post("/api/test/chat", sendChatReply);
app.use(errorHandler);

afterEach(() => {
  vi.restoreAllMocks();
});

describe("P1.1 - Backend error handling standardization", () => {
  it("should hide internal cart errors behind the global error handler", async () => {
    vi.spyOn(User, "findById").mockRejectedValue(
      new Error("Mongo internal detail: cart collection timeout")
    );

    const response = await request(app).get("/api/test/cart");

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Internal server error");
    expect(JSON.stringify(response.body)).not.toContain("Mongo internal detail");
  });

  it("should hide internal wishlist errors behind the global error handler", async () => {
    vi.spyOn(User, "findById").mockRejectedValue(
      new Error("Mongo internal detail: wishlist collection timeout")
    );

    const response = await request(app).get("/api/test/wishlist");

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Internal server error");
    expect(JSON.stringify(response.body)).not.toContain("wishlist collection timeout");
  });

  it("should hide internal review errors behind the global error handler", async () => {
    vi.spyOn(Review, "find").mockImplementation(() => {
      throw new Error("Mongo internal detail: review query stack trace");
    });

    const response = await request(app).get("/api/test/reviews");

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Internal server error");
    expect(JSON.stringify(response.body)).not.toContain("review query stack trace");
  });

  it("should hide internal chat history errors behind the global error handler", async () => {
    vi.spyOn(ChatHistory, "findOne").mockRejectedValue(
      new Error("Mongo internal detail: chat history lookup failed")
    );

    const response = await request(app).get("/api/test/chat/history");

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Internal server error");
    expect(JSON.stringify(response.body)).not.toContain("chat history lookup failed");
  });

  it("should return a friendly chatbot message instead of leaking raw AI errors", async () => {
    vi.spyOn(aiChatService, "generateChatReply").mockRejectedValue(
      new Error("Unexpected low-level Gemini stack trace")
    );

    const response = await request(app)
      .post("/api/test/chat")
      .send({ message: "xin chao" });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Chatbot dang gap loi tam thoi. Ban thu lai sau nhe.");
    expect(JSON.stringify(response.body)).not.toContain("Gemini stack trace");
    expect(JSON.stringify(response.body)).not.toContain("Unexpected low-level");
  });
});
