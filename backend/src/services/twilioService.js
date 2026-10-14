import twilio from "twilio";
import { ENV } from "../config/env.js";
import { ApiError } from "../utils/response.js";
import { logger } from "../utils/logger.js";

let twilioClient = null;

if (ENV.TWILIO_ACCOUNT_SID && ENV.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(ENV.TWILIO_ACCOUNT_SID, ENV.TWILIO_AUTH_TOKEN);
}

const formatPhone = (phone) => {
  const cleaned = String(phone).trim().replace(/[^\d+]/g, "");
  return cleaned.startsWith("+") ? cleaned : `+91${cleaned}`;
};

export const twilioService = {
  sendOTP: async (phone) => {
    if (!twilioClient) {
      throw new ApiError(500, "Twilio not configured");
    }

    try {
      const recipient = formatPhone(phone);
      const verification = await twilioClient.verify.v2
        .services(ENV.TWILIO_VERIFY_SID)
        .verifications.create({ to: recipient, channel: "sms" });

      logger.info(`OTP sent successfully to ${recipient}`);
      return verification;
    } catch (err) {
      logger.error("OTP Send Error:", err.message);
      if (err.message && err.message.toLowerCase().includes("unverified")) {
        throw new ApiError(
          400,
          "Twilio Trial: Phone number is not verified in Twilio console (twilio.com/user/account/phone-numbers/verified). Or please login via Email."
        );
      }
      throw new ApiError(500, err.message || "Failed to send OTP");
    }
  },

  verifyOTP: async (phone, otp) => {
    if (!twilioClient) {
      throw new ApiError(500, "Twilio not configured");
    }

    try {
      const recipient = formatPhone(phone);
      const verification = await twilioClient.verify.v2
        .services(ENV.TWILIO_VERIFY_SID)
        .verificationChecks.create({ to: recipient, code: otp });

      return verification.status === "approved";
    } catch (err) {
      logger.error("OTP Verify Error:", err.message);
      throw new ApiError(400, "Invalid or expired OTP");
    }
  },
};