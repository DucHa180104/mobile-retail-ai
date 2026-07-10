import mongoose from "mongoose";
import TradeInPricingRule from "../models/TradeInPricingRule.js";

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizePricingRule(rule) {
  return {
    id: rule._id,
    brand: rule.brand,
    modelName: rule.modelName,
    storage: rule.storage,
    basePrice: rule.basePrice,
    deductionRules: {
      battery80To85: rule.deductionRules?.battery80To85 || 0,
      batteryBelow80: rule.deductionRules?.batteryBelow80 || 0,
      displayReplaced: rule.deductionRules?.displayReplaced || 0,
      displayUnknown: rule.deductionRules?.displayUnknown || 0,
      bodyLightScratches: rule.deductionRules?.bodyLightScratches || 0,
      bodyHeavyScratches: rule.deductionRules?.bodyHeavyScratches || 0,
      faceIdBroken: rule.deductionRules?.faceIdBroken || 0,
      missingBoxOrCable: rule.deductionRules?.missingBoxOrCable || 0
    },
    isActive: rule.isActive,
    note: rule.note || "",
    createdAt: rule.createdAt,
    updatedAt: rule.updatedAt
  };
}

function buildPricingRulePayload(body) {
  return {
    brand: normalizeText(body.brand),
    modelName: normalizeText(body.modelName),
    storage: normalizeText(body.storage),
    basePrice: Number(body.basePrice),
    deductionRules: {
      battery80To85: Number(body.deductionRules?.battery80To85 || 0),
      batteryBelow80: Number(body.deductionRules?.batteryBelow80 || 0),
      displayReplaced: Number(body.deductionRules?.displayReplaced || 0),
      displayUnknown: Number(body.deductionRules?.displayUnknown || 0),
      bodyLightScratches: Number(body.deductionRules?.bodyLightScratches || 0),
      bodyHeavyScratches: Number(body.deductionRules?.bodyHeavyScratches || 0),
      faceIdBroken: Number(body.deductionRules?.faceIdBroken || 0),
      missingBoxOrCable: Number(body.deductionRules?.missingBoxOrCable || 0)
    },
    isActive: typeof body.isActive === "boolean" ? body.isActive : true,
    note: normalizeText(body.note)
  };
}

function validatePricingRulePayload(payload) {
  if (!payload.brand) {
    return "brand is required";
  }

  if (!payload.modelName) {
    return "modelName is required";
  }

  if (!payload.storage) {
    return "storage is required";
  }

  if (!Number.isFinite(payload.basePrice) || payload.basePrice < 0) {
    return "basePrice must be a number greater than or equal to 0";
  }

  const deductionValues = Object.values(payload.deductionRules);
  const hasInvalidDeduction = deductionValues.some(
    (value) => !Number.isFinite(value) || value < 0
  );

  if (hasInvalidDeduction) {
    return "All deductionRules values must be numbers greater than or equal to 0";
  }

  return null;
}

export const getTradeInPricingRules = async (req, res) => {
  try {
    const rules = await TradeInPricingRule.find().sort({
      brand: 1,
      modelName: 1,
      storage: 1
    });

    return res.status(200).json({
      pricingRules: rules.map(normalizePricingRule)
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Failed to fetch trade-in pricing rules"
    });
  }
};

export const getTradeInPricingRuleById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "Pricing rule id is invalid"
      });
    }

    const rule = await TradeInPricingRule.findById(id);

    if (!rule) {
      return res.status(404).json({
        message: "Trade-in pricing rule not found"
      });
    }

    return res.status(200).json({
      pricingRule: normalizePricingRule(rule)
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Failed to fetch trade-in pricing rule"
    });
  }
};

export const createTradeInPricingRule = async (req, res) => {
  try {
    const payload = buildPricingRulePayload(req.body);
    const validationError = validatePricingRulePayload(payload);

    if (validationError) {
      return res.status(400).json({
        message: validationError
      });
    }

    const rule = await TradeInPricingRule.create(payload);

    return res.status(201).json({
      message: "Trade-in pricing rule created successfully",
      pricingRule: normalizePricingRule(rule)
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        message: "A pricing rule for this brand, model and storage already exists"
      });
    }

    return res.status(500).json({
      message: error.message || "Failed to create trade-in pricing rule"
    });
  }
};

export const updateTradeInPricingRule = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "Pricing rule id is invalid"
      });
    }

    const payload = buildPricingRulePayload(req.body);
    const validationError = validatePricingRulePayload(payload);

    if (validationError) {
      return res.status(400).json({
        message: validationError
      });
    }

    const rule = await TradeInPricingRule.findById(id);

    if (!rule) {
      return res.status(404).json({
        message: "Trade-in pricing rule not found"
      });
    }

    rule.brand = payload.brand;
    rule.modelName = payload.modelName;
    rule.storage = payload.storage;
    rule.basePrice = payload.basePrice;
    rule.deductionRules = payload.deductionRules;
    rule.isActive = payload.isActive;
    rule.note = payload.note;

    await rule.save();

    return res.status(200).json({
      message: "Trade-in pricing rule updated successfully",
      pricingRule: normalizePricingRule(rule)
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        message: "A pricing rule for this brand, model and storage already exists"
      });
    }

    return res.status(500).json({
      message: error.message || "Failed to update trade-in pricing rule"
    });
  }
};

export const deleteTradeInPricingRule = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "Pricing rule id is invalid"
      });
    }

    const rule = await TradeInPricingRule.findByIdAndDelete(id);

    if (!rule) {
      return res.status(404).json({
        message: "Trade-in pricing rule not found"
      });
    }

    return res.status(200).json({
      message: "Trade-in pricing rule deleted successfully"
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Failed to delete trade-in pricing rule"
    });
  }
};
