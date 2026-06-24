import jwt from "jsonwebtoken";
import User from "../models/User.js";

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

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required"
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        message: "JWT_SECRET is missing in .env"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({
        message: "Email already exists"
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: password.trim()
    });

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: formatUserResponse(user)
    });
  } catch (error) {
    res.status(400).json({
      message: error.message || "Failed to register user"
    });
  }
};

export const loginUser = async (req, res) => {
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
    res.status(500).json({
      message: error.message || "Failed to login"
    });
  }
};

export const getMe = async (req, res) => {
  return res.status(200).json({
    user: formatUserResponse(req.user)
  });
};

export const updateProfile = async (req, res) => {
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
      user.shippingInfo = {
        fullName: typeof shippingInfo.fullName === "string" ? shippingInfo.fullName.trim() : "",
        phoneNumber:
          typeof shippingInfo.phoneNumber === "string" ? shippingInfo.phoneNumber.trim() : "",
        address: typeof shippingInfo.address === "string" ? shippingInfo.address.trim() : "",
        city: typeof shippingInfo.city === "string" ? shippingInfo.city.trim() : "",
        district: typeof shippingInfo.district === "string" ? shippingInfo.district.trim() : "",
        ward: typeof shippingInfo.ward === "string" ? shippingInfo.ward.trim() : "",
        note: typeof shippingInfo.note === "string" ? shippingInfo.note.trim() : ""
      };
    }

    await user.save();

    return res.status(200).json({
      message: "Profile updated successfully",
      user: formatUserResponse(user)
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Failed to update profile"
    });
  }
};

export const changePassword = async (req, res) => {
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
    return res.status(500).json({
      message: error.message || "Failed to change password"
    });
  }
};
