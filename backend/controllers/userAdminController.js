import mongoose from "mongoose";
import User from "../models/User.js";

function formatAdminUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phoneNumber: user.phoneNumber || "",
    shippingInfo: {
      fullName: user.shippingInfo?.fullName || "",
      phoneNumber: user.shippingInfo?.phoneNumber || "",
      address: user.shippingInfo?.address || "",
      city: user.shippingInfo?.city || "",
      district: user.shippingInfo?.district || "",
      ward: user.shippingInfo?.ward || "",
      note: user.shippingInfo?.note || ""
    },
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

export const getAdminUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });

    return res.status(200).json({
      users: users.map(formatAdminUser)
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Failed to fetch users"
    });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "User id is invalid"
      });
    }

    if (!role) {
      return res.status(400).json({
        message: "Role is required"
      });
    }

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({
        message: "Role must be user or admin"
      });
    }

    if (String(req.user._id) === String(id)) {
      return res.status(400).json({
        message: "Bạn không thể tự thay đổi quyền của chính mình"
      });
    }

    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    user.role = role;
    await user.save();

    return res.status(200).json({
      message: "Cập nhật quyền thành công",
      user: formatAdminUser(user)
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Failed to update user role"
    });
  }
};
