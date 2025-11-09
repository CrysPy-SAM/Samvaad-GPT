import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import "dotenv/config";
import twilio from "twilio";

const router = express.Router();

// ✅ Initialize Twilio client
const client =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

// ======================================================
// 📧 EMAIL + PASSWORD AUTH
// ======================================================
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "All fields required" });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ error: "User already exists" });

    const user = new User({ name, email, password });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("❌ Register error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ error: "User not found" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// ======================================================
// 📱 PHONE + OTP (NO PASSWORD)
// ======================================================

// Send OTP
router.post("/send-otp", async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone)
      return res.status(400).json({ error: "Phone number required" });

    if (!client)
      return res.status(500).json({ error: "Twilio not configured" });

    const verification = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SID)
      .verifications.create({ to: `+91${phone}`, channel: "sms" });

    res.json({ success: true, message: "OTP sent successfully" });
  } catch (err) {
    console.error("❌ OTP Send Error:", err.message);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

// Verify OTP
router.post("/verify-otp", async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp)
      return res.status(400).json({ error: "Phone and OTP required" });

    if (!client)
      return res.status(500).json({ error: "Twilio not configured" });

    const verification = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SID)
      .verificationChecks.create({ to: `+91${phone}`, code: otp });

    if (verification.status !== "approved")
      return res.status(400).json({ error: "Invalid or expired OTP" });

    let user = await User.findOne({ phone });
    if (!user) {
  user = new User({
    name: `User-${phone.slice(-4)}`, // ✅ Default name
    phone,
    phoneVerified: true,
    email: `${phone}@guest.samvaad.com`, // optional fallback email
    password: Math.random().toString(36).slice(-8), // random password
  });
  await user.save();
}


    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      success: true,
      message: "OTP verified successfully",
      token,
      user: { id: user._id, name: user.name || "User", phone },
    });
  } catch (err) {
    console.error("❌ OTP Verify Error:", err.message);
    res.status(500).json({ error: "OTP verification failed" });
  }
});

// ======================================================
// 🔒 JWT Middleware
// ======================================================
export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(403).json({ error: "Invalid or expired token" });
  }
};

export default router;
