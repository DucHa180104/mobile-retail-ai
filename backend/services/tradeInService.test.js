import { describe, expect, it } from "vitest";
import { calculateTradeInEstimate, getBasePrice } from "./tradeInService.js";

describe("tradeInService", () => {
  it("should return correct base price for a supported model", () => {
    expect(getBasePrice("iphone 12")).toBe(7000000);
  });

  it("should normalize uppercase letters and extra spaces in model name", () => {
    expect(getBasePrice("  IPHONE 14  ")).toBe(12000000);
  });

  it("should return 0 for an unsupported model", () => {
    expect(getBasePrice("iphone 99")).toBe(0);
  });

  it("should deduct 700000 when battery health is below 80 percent", () => {
    const result = calculateTradeInEstimate({
      modelName: "iphone 13",
      batteryHealth: 79,
      displayStatus: "original",
      bodyCondition: "good",
      faceIdStatus: "working",
      accessoryStatus: "full"
    });

    expect(result.basePrice).toBe(9000000);
    expect(result.deductions).toEqual([
      {
        reason: "Pin duoi 80%",
        amount: 700000
      }
    ]);
    expect(result.estimatedPrice).toBe(8300000);
  });

  it("should combine multiple deductions and never return a negative estimated price", () => {
    const result = calculateTradeInEstimate({
      modelName: "iphone 11",
      batteryHealth: 70,
      displayStatus: "replaced",
      bodyCondition: "heavy_scratches",
      faceIdStatus: "broken",
      accessoryStatus: "missing_box_or_cable"
    });

    expect(result.basePrice).toBe(5000000);
    expect(result.deductions).toEqual([
      {
        reason: "Pin duoi 80%",
        amount: 700000
      },
      {
        reason: "Man hinh da thay",
        amount: 1000000
      },
      {
        reason: "Than may xuoc nhieu",
        amount: 800000
      },
      {
        reason: "Face ID hong",
        amount: 1200000
      },
      {
        reason: "Thieu hop hoac cap sac",
        amount: 300000
      }
    ]);
    expect(result.estimatedPrice).toBe(1000000);
    expect(result.estimatedPrice).toBeGreaterThanOrEqual(0);
  });

  it("should deduct 400000 when battery health is between 80 and 85 percent", () => {
    const result = calculateTradeInEstimate({
      modelName: "iphone 12",
      batteryHealth: 85,
      displayStatus: "original",
      bodyCondition: "good",
      faceIdStatus: "working",
      accessoryStatus: "full"
    });

    expect(result.basePrice).toBe(7000000);
    expect(result.deductions).toEqual([
      {
        reason: "Pin tu 80% den 85%",
        amount: 400000
      }
    ]);
    expect(result.estimatedPrice).toBe(6600000);
  });

  it("should not deduct battery cost when battery health is above 85 percent", () => {
    const result = calculateTradeInEstimate({
      modelName: "iphone 14",
      batteryHealth: 90,
      displayStatus: "original",
      bodyCondition: "good",
      faceIdStatus: "working",
      accessoryStatus: "full"
    });

    expect(result.basePrice).toBe(12000000);
    expect(result.deductions).toEqual([]);
    expect(result.estimatedPrice).toBe(12000000);
  });

  it("should deduct 500000 when display status is unknown", () => {
    const result = calculateTradeInEstimate({
      modelName: "iphone 12",
      batteryHealth: 90,
      displayStatus: "unknown",
      bodyCondition: "good",
      faceIdStatus: "working",
      accessoryStatus: "full"
    });

    expect(result.deductions).toEqual([
      {
        reason: "Khong ro tinh trang man hinh",
        amount: 500000
      }
    ]);
    expect(result.estimatedPrice).toBe(6500000);
  });

  it("should return estimated price 0 for unsupported model even if many deductions exist", () => {
    const result = calculateTradeInEstimate({
      modelName: "iphone 99",
      batteryHealth: 60,
      displayStatus: "replaced",
      bodyCondition: "heavy_scratches",
      faceIdStatus: "broken",
      accessoryStatus: "missing_box_or_cable"
    });

    expect(result.basePrice).toBe(0);
    expect(result.deductions).toEqual([
      {
        reason: "Pin duoi 80%",
        amount: 700000
      },
      {
        reason: "Man hinh da thay",
        amount: 1000000
      },
      {
        reason: "Than may xuoc nhieu",
        amount: 800000
      },
      {
        reason: "Face ID hong",
        amount: 1200000
      },
      {
        reason: "Thieu hop hoac cap sac",
        amount: 300000
      }
    ]);
    expect(result.estimatedPrice).toBe(0);
  });
});
