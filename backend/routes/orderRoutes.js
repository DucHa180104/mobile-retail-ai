import express from "express";
import {
  createOrder,
  getOrderById,
  getMyOrders,
  getOrders,
  updateOrderStatus,
  cancelMyOrder
} from "../controllers/orderController.js";
import { protect, protectAdmin, protectOptional } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protectOptional, createOrder);
router.get("/", protect, protectAdmin, getOrders);
router.get("/my-orders", protect, getMyOrders);
router.get("/:id", protect, getOrderById);
router.patch("/:id/cancel", protect, cancelMyOrder);
router.patch("/:id/status", protect, protectAdmin, updateOrderStatus);

export default router;
