import TradeInPricingRule from "../models/TradeInPricingRule.js";

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function findTradeInPricingRule({ brand, modelName, storage }) {
  const normalizedBrand = normalizeText(brand);
  const normalizedModelName = normalizeText(modelName);
  const normalizedStorage = normalizeText(storage);

  if (!normalizedModelName || !normalizedStorage) {
    return null;
  }

  const query = {
    isActive: true,
    modelName: new RegExp(`^${escapeRegex(normalizedModelName)}$`, "i"),
    storage: new RegExp(`^${escapeRegex(normalizedStorage)}$`, "i")
  };

  if (normalizedBrand) {
    query.brand = new RegExp(`^${escapeRegex(normalizedBrand)}$`, "i");
  }

  return TradeInPricingRule.findOne(query);
}

export async function getBasePrice(input) {
  const pricingRule = await findTradeInPricingRule(input);

  return pricingRule?.basePrice || 0;
}

function buildDeductionsFromRule(input, pricingRule) {
  const {
    batteryHealth,
    displayStatus,
    bodyCondition,
    faceIdStatus,
    accessoryStatus
  } = input;

  const deductions = [];
  const rules = pricingRule?.deductionRules || {};

  if (batteryHealth < 80) {
    deductions.push({
      reason: "Pin dưới 80%",
      amount: rules.batteryBelow80 || 0
    });
  } else if (batteryHealth >= 80 && batteryHealth <= 85) {
    deductions.push({
      reason: "Pin từ 80% đến 85%",
      amount: rules.battery80To85 || 0
    });
  }

  if (displayStatus === "replaced") {
    deductions.push({
      reason: "Màn hình đã thay",
      amount: rules.displayReplaced || 0
    });
  } else if (displayStatus === "unknown") {
    deductions.push({
      reason: "Không rõ tình trạng màn hình",
      amount: rules.displayUnknown || 0
    });
  }

  if (bodyCondition === "light_scratches") {
    deductions.push({
      reason: "Thân máy xước nhẹ",
      amount: rules.bodyLightScratches || 0
    });
  } else if (bodyCondition === "heavy_scratches") {
    deductions.push({
      reason: "Thân máy xước nhiều",
      amount: rules.bodyHeavyScratches || 0
    });
  }

  if (faceIdStatus === "broken") {
    deductions.push({
      reason: "Face ID hỏng",
      amount: rules.faceIdBroken || 0
    });
  }

  if (accessoryStatus === "missing_box_or_cable") {
    deductions.push({
      reason: "Thiếu hộp hoặc cáp sạc",
      amount: rules.missingBoxOrCable || 0
    });
  }

  return deductions.filter((item) => item.amount > 0);
}

export async function calculateTradeInEstimate(input) {
  const pricingRule = await findTradeInPricingRule(input);
  const basePrice = pricingRule?.basePrice || 0;
  const deductions = buildDeductionsFromRule(input, pricingRule);
  const totalDeductions = deductions.reduce(
    (total, item) => total + item.amount,
    0
  );

  return {
    basePrice,
    deductions,
    estimatedPrice: Math.max(basePrice - totalDeductions, 0),
    pricingRuleId: pricingRule?._id || null
  };
}
