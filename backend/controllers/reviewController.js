import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Review from "../models/Review.js";

export const createReview = async (req, res) => {
  try {
    const { productId, orderId, rating, comment = "", images = [] } = req.body;
    const numericRating = Number(rating);
    const normalizedImages = Array.isArray(images)
      ? images.filter((image) => typeof image === "string" && image.trim()).slice(0, 3)
      : [];

    if (!productId || !orderId) {
      return res.status(400).json({
        message: "productId and orderId are required"
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(productId) ||
      !mongoose.Types.ObjectId.isValid(orderId)
    ) {
      return res.status(400).json({
        message: "Invalid productId or orderId"
      });
    }

    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        message: "Rating must be an integer from 1 to 5"
      });
    }

    if (!Array.isArray(images)) {
      return res.status(400).json({
        message: "Images must be an array"
      });
    }

    if (images.length > 3) {
      return res.status(400).json({
        message: "You can upload at most 3 review images"
      });
    }

    const product = await Product.findById(productId).select("_id");

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id,
      status: "confirmed",
      "items.productId": productId
    }).select("_id user status items");

    if (!order) {
      return res.status(400).json({
        message: "You can only review products from your confirmed orders"
      });
    }

    const existingReview = await Review.findOne({
      user: req.user._id,
      product: productId
    }).select("_id");

    if (existingReview) {
      return res.status(400).json({
        message: "You have already reviewed this product"
      });
    }

    const review = await Review.create({
      user: req.user._id,
      product: productId,
      order: orderId,
      rating: numericRating,
      comment: comment.trim(),
      images: normalizedImages
    });

    const populatedReview = await Review.findById(review._id)
      .populate("user", "name")
      .populate("product", "name images")
      .populate("order", "_id");

    res.status(201).json(populatedReview);
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({
        message: "You have already reviewed this product"
      });
    }

    res.status(500).json({
      message: error.message || "Failed to create review"
    });
  }
};

export const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment = "", images = [] } = req.body;
    const numericRating = Number(rating);
    const normalizedImages = Array.isArray(images)
      ? images.filter((image) => typeof image === "string" && image.trim()).slice(0, 3)
      : [];

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({
        message: "Invalid reviewId"
      });
    }

    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        message: "Rating must be an integer from 1 to 5"
      });
    }

    if (!Array.isArray(images)) {
      return res.status(400).json({
        message: "Images must be an array"
      });
    }

    if (images.length > 3) {
      return res.status(400).json({
        message: "You can upload at most 3 review images"
      });
    }

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        message: "Review not found"
      });
    }

    if (String(review.user) !== String(req.user._id)) {
      return res.status(403).json({
        message: "You can only edit your own review"
      });
    }

    review.rating = numericRating;
    review.comment = comment.trim();
    review.images = normalizedImages;
    await review.save();

    const populatedReview = await Review.findById(review._id)
      .populate("user", "name")
      .populate("product", "name images")
      .populate("order", "_id");

    res.status(200).json(populatedReview);
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to update review"
    });
  }
};

export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        message: "Invalid productId"
      });
    }

    const reviews = await Review.find({ product: productId })
      .populate("user", "name")
      .sort({ createdAt: -1 });

    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to fetch product reviews"
    });
  }
};

export const getReviews = async (_req, res) => {
  try {
    const reviews = await Review.find()
      .populate("user", "name")
      .populate("product", "name images")
      .sort({ createdAt: -1 });

    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to fetch reviews"
    });
  }
};
