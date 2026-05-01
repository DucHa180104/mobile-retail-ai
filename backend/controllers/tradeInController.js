import { calculateTradeInEstimate, getBasePrice } from "../services/tradeInService.js";

const VALID_DISPLAY_STATUS = ["original", "replaced", "unknown"];
const VALID_BODY_CONDITION = ["clean", "light_scratches", "heavy_scratches"];
const VALID_FACE_ID_STATUS = ["working", "broken"];
const VALID_ACCESSORY_STATUS = ["full", "missing_box_or_cable"];

export const estimateTradeIn = (req, res) => {
  try {
    const {
      modelName,
      storage,
      batteryHealth,
      displayStatus,
      bodyCondition,
      faceIdStatus,
      accessoryStatus
    } = req.body;

    if (!modelName || !modelName.trim()) {
      return res.status(400).json({ message: "modelName is required" });
    }

    if (!storage || !storage.trim()) {
      return res.status(400).json({ message: "storage is required" });
    }

    if (typeof batteryHealth !== "number" || Number.isNaN(batteryHealth)) {
      return res.status(400).json({ message: "batteryHealth must be a number" });
    }

    if (batteryHealth < 0 || batteryHealth > 100) {
      return res.status(400).json({ message: "batteryHealth must be between 0 and 100" });
    }

    if (!VALID_DISPLAY_STATUS.includes(displayStatus)) {
      return res.status(400).json({
        message: "displayStatus must be original, replaced or unknown"
      });
    }

    if (!VALID_BODY_CONDITION.includes(bodyCondition)) {
      return res.status(400).json({
        message: "bodyCondition must be clean, light_scratches or heavy_scratches"
      });
    }

    if (!VALID_FACE_ID_STATUS.includes(faceIdStatus)) {
      return res.status(400).json({
        message: "faceIdStatus must be working or broken"
      });
    }

    if (!VALID_ACCESSORY_STATUS.includes(accessoryStatus)) {
      return res.status(400).json({
        message: "accessoryStatus must be full or missing_box_or_cable"
      });
    }

    const basePrice = getBasePrice(modelName);

    if (!basePrice) {
      return res.status(400).json({ message: "Unsupported modelName" });
    }

    const estimate = calculateTradeInEstimate({
      modelName,
      storage,
      batteryHealth,
      displayStatus,
      bodyCondition,
      faceIdStatus,
      accessoryStatus
    });

    res.status(200).json(estimate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
