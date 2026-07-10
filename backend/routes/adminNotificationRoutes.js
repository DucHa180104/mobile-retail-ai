import express from "express";
import {
  getAdminNotifications,
  markAdminNotificationAsRead,
  markAllAdminNotificationsAsRead
} from "../controllers/adminNotificationController.js";
import { protect, protectAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, protectAdmin, getAdminNotifications);
router.patch("/read-all", protect, protectAdmin, markAllAdminNotificationsAsRead);
router.patch("/:id/read", protect, protectAdmin, markAdminNotificationAsRead);

export default router;
