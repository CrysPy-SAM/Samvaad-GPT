import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env.js";
import { ApiError } from "../utils/response.js";
import { twilioService } from "../services/twilioService.js";
import { logger } from "../utils/logger.js";

export const authController = {
  // Register with Email/Password
  register: async (req, res, next) => {
    try {
      const { name, email, password } = req.body;

      const existing = await User.findOne({ email });
      if (existing) {
        throw new ApiError(400, "User already exists");
      }

      const user = new User({ name, email, password });
      await user.save();

      const token = jwt.sign({ id: user._id }, ENV.JWT_SECRET, {
        expiresIn: ENV.JWT_EXPIRES_IN,
      });

      logger.success(`User registered: ${email}`);

      res.status(201).json({
        success: true,
        message: "Account created successfully",
        token,
        user: { id: user._id, name: user.name, email: user.email },
      });
    } catch (err) {
      next(err);
    }
  },

  // Login with Email/Password
  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        throw new ApiError(400, "User not found");
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        throw new ApiError(400, "Invalid credentials");
      }

      const token = jwt.sign({ id: user._id }, ENV.JWT_SECRET, {
        expiresIn: ENV.JWT_EXPIRES_IN,
      });

      logger.success(`User logged in: ${email}`);

      res.json({
        success: true,
        message: "Login successful",
        token,
        user: { id: user._id, name: user.name, email: user.email },
      });
    } catch (err) {
      next(err);
    }
  },

  // Send OTP (Phone Auth)
  sendOTP: async (req, res, next) => {
  try {
    const { phone, name } = req.body;

    if (!phone) {
      throw new ApiError(400, "Phone number required");
    }

    await twilioService.sendOTP(phone);

    logger.info(`OTP sent to: ${phone}${name ? ` (Name: ${name})` : ""}`);

    res.json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (err) {
    next(err);
  }
},

// Verify OTP (Phone Auth)
verifyOTP: async (req, res, next) => {
  try {
    const { phone, otp, name } = req.body;

    if (!phone || !otp) {
      throw new ApiError(400, "Phone and OTP required");
    }

    // ✅ Verify OTP via Twilio
    const isVerified = await twilioService.verifyOTP(phone, otp);
    if (!isVerified) {
      throw new ApiError(400, "Invalid or expired OTP");
    }

    // ✅ Find user by phone
    let user = await User.findOne({ phone });

    if (!user) {
      // 👤 Create new user with name
      user = new User({
        name: name?.trim() || `User-${phone.slice(-4)}`,
        phone,
        phoneVerified: true,
        email: `${phone}@guest.samvaad.com`,
        password: Math.random().toString(36).slice(-8),
      });
      await user.save();
      logger.success(`New user created via phone: ${phone}`);
    } else {
      // 🔁 Update existing user's name if not set or generic
      if (name && (!user.name || user.name.startsWith("User-"))) {
        user.name = name.trim();
        await user.save();
        logger.info(`User name updated for ${phone}: ${user.name}`);
      }
    }

    // ✅ Generate token
    const token = jwt.sign(
      { id: user._id, phone: user.phone, email: user.email },
      ENV.JWT_SECRET,
      { expiresIn: ENV.JWT_EXPIRES_IN }
    );

    // ✅ Send proper response
    res.json({
      success: true,
      message: "OTP verified successfully",
      token,
      user: { id: user._id, name: user.name, phone },
    });
  } catch (err) {
    next(err);
  }
},
};