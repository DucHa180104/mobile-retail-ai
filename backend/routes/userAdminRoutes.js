import express from "express";
import { getAdminUsers, updateUserRole } from "../controllers/userAdminController.js";
import { protect, protectAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, protectAdmin, getAdminUsers);
router.patch("/:id/role", protect, protectAdmin, updateUserRole);

export default router;
