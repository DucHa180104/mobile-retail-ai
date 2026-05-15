import jwt from "jsonwebtoken";
import User from "../models/User.js";

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
    role: user.role
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

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

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
