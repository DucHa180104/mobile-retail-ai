const BASE_PRICES = {
  "iphone 11": 5000000,
  "iphone 12": 7000000,
  "iphone 13": 9000000,
  "iphone 14": 12000000,
  "iphone 15 pro max": 20000000
};

function normalizeModelName(modelName) {
  return modelName.trim().toLowerCase();
}

function getBasePrice(modelName) {
  return BASE_PRICES[normalizeModelName(modelName)] || 0;
}

function calculateTradeInEstimate(input) {
  const {
    modelName,
    batteryHealth,
    displayStatus,
    bodyCondition,
    faceIdStatus,
    accessoryStatus
  } = input;

  const basePrice = getBasePrice(modelName);
  const deductions = [];

  if (batteryHealth < 80) {
    deductions.push({
      reason: "Pin duoi 80%",
      amount: 700000
    });
  } else if (batteryHealth >= 80 && batteryHealth <= 85) {
    deductions.push({
      reason: "Pin tu 80% den 85%",
      amount: 400000
    });
  }

  if (displayStatus === "replaced") {
    deductions.push({
      reason: "Man hinh da thay",
      amount: 1000000
    });
  } else if (displayStatus === "unknown") {
    deductions.push({
      reason: "Khong ro tinh trang man hinh",
      amount: 500000
    });
  }

  if (bodyCondition === "light_scratches") {
    deductions.push({
      reason: "Than may xuoc nhe",
      amount: 300000
    });
  } else if (bodyCondition === "heavy_scratches") {
    deductions.push({
      reason: "Than may xuoc nhieu",
      amount: 800000
    });
  }

  if (faceIdStatus === "broken") {
    deductions.push({
      reason: "Face ID hong",
      amount: 1200000
    });
  }

  if (accessoryStatus === "missing_box_or_cable") {
    deductions.push({
      reason: "Thieu hop hoac cap sac",
      amount: 300000
    });
  }

  const totalDeductions = deductions.reduce(
    (total, item) => total + item.amount,
    0
  );

  return {
    basePrice,
    deductions,
    estimatedPrice: Math.max(basePrice - totalDeductions, 0)
  };
}

export { BASE_PRICES, calculateTradeInEstimate, getBasePrice };
