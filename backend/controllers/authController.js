import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { sendWelcomeEmail } from "../services/emailService.js";


const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCK_TIME_MS = 10 * 60 * 1000;

function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
  });
}

function formatUserResponse(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    phoneNumber: user.phoneNumber || "",
    shippingInfo: {
      fullName: user.shippingInfo?.fullName || "",
      phoneNumber: user.shippingInfo?.phoneNumber || "",
      address: user.shippingInfo?.address || "",
      city: user.shippingInfo?.city || "",
      district: user.shippingInfo?.district || "",
      ward: user.shippingInfo?.ward || "",
      note: user.shippingInfo?.note || ""
    }
  };
}

export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, phoneNumber } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Họ tên, email và mật khẩu là bắt buộc"
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        message: "JWT_SECRET is missing in .env"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    
    // Mật khẩu có ít nhất 8 ký tự
    if (password.length < 8) {
      return res.status(400).json({ message: "Mật khẩu phải chứa ít nhất 8 ký tự" });
    }
    // Có chữ hoa
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ message: "Mật khẩu phải chứa ít nhất 1 chữ hoa" });
    }
    // Có chữ thường
    if (!/[a-z]/.test(password)) {
      return res.status(400).json({ message: "Mật khẩu phải chứa ít nhất 1 chữ thường" });
    }
    // Có số
    if (!/[0-9]/.test(password)) {
      return res.status(400).json({ message: "Mật khẩu phải chứa ít nhất 1 chữ số" });
    }
    // Có ký tự đặc biệt
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return res.status(400).json({ message: "Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt" });
    }
    // Không chứa thông tin cá nhân
    const lowerName = name.toLowerCase().trim();
    const emailPrefix = normalizedEmail.split("@")[0].toLowerCase();
    const cleanPhone = phoneNumber ? phoneNumber.replace(/\D/g, "") : "";
    const lowerPassword = password.toLowerCase();
    
    if (
      lowerPassword.includes(lowerName) ||
      lowerPassword.includes(emailPrefix) ||
      (cleanPhone && lowerPassword.includes(cleanPhone))
    ) {
      return res.status(400).json({
        message: "Mật khẩu không được chứa thông tin cá nhân (tên, email hoặc số điện thoại)"
      });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({
        message: "Email đã tồn tại trên hệ thống"
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: password.trim(),
      phoneNumber: phoneNumber ? phoneNumber.trim() : ""
    });

    const token = generateToken(user._id);

    // Gửi email chào mừng thành viên mới (chạy bất đồng bộ, không chặn API phản hồi)
    try {
      sendWelcomeEmail(user, user.email).catch((emailError) => {
        console.error("Welcome email async error:", emailError.message);
      });
    } catch (emailError) {
      console.error("Welcome email error:", emailError.message);
    }

    res.status(201).json({
      token,
      user: formatUserResponse(user)
    });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        message: "JWT_SECRET is missing in .env"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    if (user.lockUntil && user.lockUntil > new Date()) {
      return res.status(423).json({
        message: "Tài khoản tạm thời bị khóa do đăng nhập sai quá nhiều lần. Vui lòng thử lại sau."
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        message: "Tài khoản đã bị khóa"
      });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      user.failedLoginAttempts += 1;

      if (user.failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOGIN_LOCK_TIME_MS);
        user.failedLoginAttempts = 0;
      }

      await user.save();

      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    const token = generateToken(user._id);

    res.status(200).json({
      token,
      user: formatUserResponse(user)
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res) => {
  return res.status(200).json({
    user: formatUserResponse(req.user)
  });
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, phoneNumber, shippingInfo } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    if (typeof name === "string" && name.trim()) {
      user.name = name.trim();
    }

    if (typeof phoneNumber === "string") {
      user.phoneNumber = phoneNumber.trim();
    }

    if (shippingInfo && typeof shippingInfo === "object") {
      const currentShippingInfo = user.shippingInfo?.toObject?.() || user.shippingInfo || {};
      const nextShippingInfo = { ...currentShippingInfo };

      const shippingFields = [
        "fullName",
        "phoneNumber",
        "address",
        "city",
        "district",
        "ward",
        "note"
      ];

      for (const field of shippingFields) {
        if (Object.prototype.hasOwnProperty.call(shippingInfo, field)) {
          nextShippingInfo[field] =
            typeof shippingInfo[field] === "string" ? shippingInfo[field].trim() : "";
        }
      }

      user.shippingInfo = nextShippingInfo;
    }

    await user.save();

    return res.status(200).json({
      message: "Profile updated successfully",
      user: formatUserResponse(user)
    });
  } catch (error) {
    return next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current password and new password are required"
      });
    }

    if (String(newPassword).trim().length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters"
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const isPasswordValid = await user.comparePassword(currentPassword);

    if (!isPasswordValid) {
      return res.status(400).json({
        message: "Current password is incorrect"
      });
    }

    user.password = String(newPassword).trim();
    await user.save();

    return res.status(200).json({
      message: "Password changed successfully"
    });
  } catch (error) {
    return next(error);
  }
};
