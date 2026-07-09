import mongoose from "mongoose";

const contactSettingsSchema = new mongoose.Schema(
  {
    storePhone: {
      type: String,
      trim: true,
      default: ""
    },
    supportEmail: {
      type: String,
      trim: true,
      default: ""
    },
    storeAddress: {
      type: String,
      trim: true,
      default: ""
    },
    zaloQrImageUrl: {
      type: String,
      trim: true,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

const ContactSettings = mongoose.model("ContactSettings", contactSettingsSchema);

export default ContactSettings;
