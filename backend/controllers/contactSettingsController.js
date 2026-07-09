import ContactSettings from "../models/ContactSettings.js";

async function getOrCreateContactSettings() {
  let settings = await ContactSettings.findOne();

  if (!settings) {
    settings = await ContactSettings.create({});
  }

  return settings;
}

export const getContactSettings = async (req, res, next) => {
  try {
    const settings = await getOrCreateContactSettings();

    return res.json({
      storePhone: settings.storePhone || "",
      supportEmail: settings.supportEmail || "",
      storeAddress: settings.storeAddress || "",
      zaloQrImageUrl: settings.zaloQrImageUrl || ""
    });
  } catch (error) {
    return next(error);
  }
};

export const updateContactSettings = async (req, res, next) => {
  try {
    const {
      storePhone = "",
      supportEmail = "",
      storeAddress = "",
      zaloQrImageUrl = ""
    } = req.body || {};

    const settings = await getOrCreateContactSettings();
    settings.storePhone = String(storePhone).trim();
    settings.supportEmail = String(supportEmail).trim();
    settings.storeAddress = String(storeAddress).trim();
    settings.zaloQrImageUrl = String(zaloQrImageUrl).trim();
    await settings.save();

    return res.json({
      message: "Cập nhật thông tin liên hệ thành công",
      storePhone: settings.storePhone || "",
      supportEmail: settings.supportEmail || "",
      storeAddress: settings.storeAddress || "",
      zaloQrImageUrl: settings.zaloQrImageUrl || ""
    });
  } catch (error) {
    return next(error);
  }
};
