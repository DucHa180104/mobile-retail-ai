import express from "express";
import {
  addToCart,
  clearCart,
  getCart,
  removeFromCart,
  syncCart,
  updateCartItemQuantity
} from "../controllers/cartController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getCart);
router.post("/", protect, addToCart);
router.put("/sync", protect, syncCart);
router.put("/:productId", protect, updateCartItemQuantity);
router.delete("/:productId", protect, removeFromCart);
router.delete("/", protect, clearCart);

export default router;
