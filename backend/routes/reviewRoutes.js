import express from "express";
import {
  createReview,
  getProductReviews,
  getReviews,
  updateReview
} from "../controllers/reviewController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createReview);
router.put("/:reviewId", protect, updateReview);
router.get("/product/:productId", getProductReviews);
router.get("/", getReviews);

export default router;
