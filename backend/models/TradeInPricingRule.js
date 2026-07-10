import mongoose from "mongoose";

const deductionRulesSchema = new mongoose.Schema(
  {
    battery80To85: {
      type: Number,
      default: 0,
      min: 0
    },
    batteryBelow80: {
      type: Number,
      default: 0,
      min: 0
    },
    displayReplaced: {
      type: Number,
      default: 0,
      min: 0
    },
    displayUnknown: {
      type: Number,
      default: 0,
      min: 0
    },
    bodyLightScratches: {
      type: Number,
      default: 0,
      min: 0
    },
    bodyHeavyScratches: {
      type: Number,
      default: 0,
      min: 0
    },
    faceIdBroken: {
      type: Number,
      default: 0,
      min: 0
    },
    missingBoxOrCable: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    _id: false
  }
);

const tradeInPricingRuleSchema = new mongoose.Schema(
  {
    brand: {
      type: String,
      required: true,
      trim: true
    },
    modelName: {
      type: String,
      required: true,
      trim: true
    },
    storage: {
      type: String,
      required: true,
      trim: true
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0
    },
    deductionRules: {
      type: deductionRulesSchema,
      default: () => ({})
    },
    isActive: {
      type: Boolean,
      default: true
    },
    note: {
      type: String,
      trim: true,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

tradeInPricingRuleSchema.index(
  { brand: 1, modelName: 1, storage: 1 },
  { unique: true }
);

const TradeInPricingRule = mongoose.model("TradeInPricingRule", tradeInPricingRuleSchema);

export default TradeInPricingRule;
