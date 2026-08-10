import { beforeEach, describe, expect, it, vi } from "vitest";
import TradeInPricingRule from "../models/TradeInPricingRule.js";
import { calculateTradeInEstimate, getBasePrice } from "./tradeInService.js";

vi.mock("../models/TradeInPricingRule.js", () => ({
  default: {
    findOne: vi.fn()
  }
}));

const defaultDeductionRules = {
  battery80To85: 400000,
  batteryBelow80: 700000,
  displayReplaced: 1000000,
  displayUnknown: 500000,
  bodyLightScratches: 300000,
  bodyHeavyScratches: 800000,
  faceIdBroken: 1200000,
  missingBoxOrCable: 300000
};

function createPricingRule(overrides = {}) {
  return {
    _id: "pricing-rule-1",
    brand: "Apple",
    modelName: "iPhone 12",
    storage: "128GB",
    basePrice: 7000000,
    deductionRules: { ...defaultDeductionRules },
    isActive: true,
    ...overrides
  };
}

function createEstimateInput(overrides = {}) {
  return {
    brand: "Apple",
    modelName: "iPhone 12",
    storage: "128GB",
    batteryHealth: 90,
    displayStatus: "original",
    bodyCondition: "clean",
    faceIdStatus: "working",
    accessoryStatus: "full",
    ...overrides
  };
}

describe("tradeInService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the base price from an active MongoDB pricing rule", async () => {
    TradeInPricingRule.findOne.mockResolvedValue(createPricingRule());

    const basePrice = await getBasePrice({
      brand: "Apple",
      modelName: "iPhone 12",
      storage: "128GB"
    });

    expect(basePrice).toBe(7000000);
  });

  it("normalizes surrounding spaces and performs case-insensitive matching", async () => {
    TradeInPricingRule.findOne.mockResolvedValue(createPricingRule());

    await getBasePrice({
      brand: "  APPLE  ",
      modelName: "  IPHONE 12  ",
      storage: "  128gb  "
    });

    const query = TradeInPricingRule.findOne.mock.calls[0][0];
    expect(query.isActive).toBe(true);
    expect(query.brand.test("Apple")).toBe(true);
    expect(query.modelName.test("iPhone 12")).toBe(true);
    expect(query.storage.test("128GB")).toBe(true);
  });

  it("returns 0 when no active pricing rule is found", async () => {
    TradeInPricingRule.findOne.mockResolvedValue(null);

    const basePrice = await getBasePrice({
      brand: "Apple",
      modelName: "iPhone 99",
      storage: "128GB"
    });

    expect(basePrice).toBe(0);
  });

  it("applies the pricing rule deduction when battery health is below 80 percent", async () => {
    TradeInPricingRule.findOne.mockResolvedValue(createPricingRule());

    const result = await calculateTradeInEstimate(
      createEstimateInput({ batteryHealth: 79 })
    );

    expect(result.basePrice).toBe(7000000);
    expect(result.deductions).toEqual([
      { reason: "Pin dưới 80%", amount: 700000 }
    ]);
    expect(result.estimatedPrice).toBe(6300000);
    expect(result.pricingRuleId).toBe("pricing-rule-1");
  });

  it("combines deductions from the rule and never returns a negative price", async () => {
    TradeInPricingRule.findOne.mockResolvedValue(
      createPricingRule({
        basePrice: 1000000,
        deductionRules: {
          ...defaultDeductionRules,
          batteryBelow80: 700000,
          displayReplaced: 1000000,
          bodyHeavyScratches: 800000,
          faceIdBroken: 1200000,
          missingBoxOrCable: 300000
        }
      })
    );

    const result = await calculateTradeInEstimate(
      createEstimateInput({
        batteryHealth: 70,
        displayStatus: "replaced",
        bodyCondition: "heavy_scratches",
        faceIdStatus: "broken",
        accessoryStatus: "missing_box_or_cable"
      })
    );

    expect(result.deductions.map((item) => item.amount)).toEqual([
      700000,
      1000000,
      800000,
      1200000,
      300000
    ]);
    expect(result.estimatedPrice).toBe(0);
  });

  it("applies the 80-to-85 battery deduction configured by the rule", async () => {
    TradeInPricingRule.findOne.mockResolvedValue(createPricingRule());

    const result = await calculateTradeInEstimate(
      createEstimateInput({ batteryHealth: 85 })
    );

    expect(result.deductions).toEqual([
      { reason: "Pin từ 80% đến 85%", amount: 400000 }
    ]);
    expect(result.estimatedPrice).toBe(6600000);
  });

  it("does not deduct battery cost when battery health is above 85 percent", async () => {
    TradeInPricingRule.findOne.mockResolvedValue(createPricingRule());

    const result = await calculateTradeInEstimate(createEstimateInput());

    expect(result.deductions).toEqual([]);
    expect(result.estimatedPrice).toBe(7000000);
  });

  it("applies the display-unknown deduction configured by the rule", async () => {
    TradeInPricingRule.findOne.mockResolvedValue(createPricingRule());

    const result = await calculateTradeInEstimate(
      createEstimateInput({ displayStatus: "unknown" })
    );

    expect(result.deductions).toEqual([
      { reason: "Không rõ tình trạng màn hình", amount: 500000 }
    ]);
    expect(result.estimatedPrice).toBe(6500000);
  });

  it("handles incomplete input without querying MongoDB", async () => {
    const basePrice = await getBasePrice({ modelName: "", storage: "" });
    const estimate = await calculateTradeInEstimate({
      modelName: "",
      storage: "",
      batteryHealth: 70,
      displayStatus: "replaced"
    });

    expect(basePrice).toBe(0);
    expect(estimate).toEqual({
      basePrice: 0,
      deductions: [],
      estimatedPrice: 0,
      pricingRuleId: null
    });
    expect(TradeInPricingRule.findOne).not.toHaveBeenCalled();
  });
});
