import express from "express";
import { getContactSettings, updateContactSettings } from "../controllers/contactSettingsController.js";
import { protect, protectAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getContactSettings);
router.put("/", protect, protectAdmin, updateContactSettings);

export default router;
