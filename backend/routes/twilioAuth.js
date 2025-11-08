// routes/twilioAuth.js
import express from "express";
import "dotenv/config";
import twilio from "twilio";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifySid = process.env.TWILIO_VERIFY_SID;

if (!accountSid || !authToken || !verifySid) {
  console.warn("⚠️ Twilio env vars missing (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SID)");
}

const client = twilio(accountSid, authToken);

// Helper: normalize phone to E.164 lightly (expect front-end to send E.164 ideally)
const normalizePhone = (phone) => {
  if (!phone) return null;
  // simple normalization: remove spaces, dashes
  return phone.replace(/\s|-/g, "");
};

// Rate-limiting note: Twilio Verify enforces its own anti-abuse measures. You may also add server-side rate-limiter per phone here.

router.post("/send-otp", async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: "phone is required" });

    const to = normalizePhone(phone);

    // Start a verification:
    const verification = await client.verify.services(verifySid)
      .verifications
      .create({ to, channel: "sms" });

    res.status(200).json({
      success: true,
      message: "OTP sent",
      sid: verification.sid,
      status: verification.status // e.g., "pending"
    });
  } catch (err) {
    console.error("❌ Twilio send-otp error:", err);
    res.status(500).json({ error: "Failed to send OTP", details: err.message });
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    const { phone, code, name, createIfNotExist = true } = req.body;
    if (!phone || !code) return res.status(400).json({ error: "phone and code are required" });

    const to = normalizePhone(phone);

    // Check verification
    const check = await client.verify.services(verifySid)
      .verificationChecks
      .create({ to, code });

    if (!check || check.status !== "approved") {
      return res.status(400).json({ error: "Invalid code or not approved", status: check?.status });
    }

    // Find or create user
    let user = await User.findOne({ phone: to });

    if (!user && createIfNotExist) {
      // If no name provided, fallback to phone
      const createName = name ? name : `User-${to.slice(-4)}`;
      user = new User({
        name: createName,
        phone: to,
        phoneVerified: true
      });
      await user.save();
    } else if (user) {
      if (!user.phoneVerified) {
        user.phoneVerified = true;
        await user.save();
      }
    }

    if (!user) {
      return res.status(404).json({ error: "User not found. Provide name to create a new account." });
    }

    // Issue JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(200).json({
      success: true,
      message: "Phone verified",
      token,
      user: { id: user._id, name: user.name, phone: user.phone, phoneVerified: user.phoneVerified }
    });

  } catch (err) {
    console.error("❌ Twilio verify-otp error:", err);
    res.status(500).json({ error: "OTP verification failed", details: err.message });
  }
});

export default router;
