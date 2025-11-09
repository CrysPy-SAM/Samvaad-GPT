import twilio from "twilio";
import { ENV } from "../config/env.js";
import { ApiError } from "../utils/response.js";
import { logger } from "../utils/logger.js";

let twilioClient = null;

if (ENV.TWILIO_ACCOUNT_SID && ENV.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(ENV.TWILIO_ACCOUNT_SID, ENV.TWILIO_AUTH_TOKEN);
}

export const twilioService = {
  sendOTP: async (phone) => {
    if (!twilioClient) {
      throw new ApiError(500, "Twilio not configured");
    }

    try {
      const verification = await twilioClient.verify.v2
        .services(ENV.TWILIO_VERIFY_SID)
        .verifications.create({ to: `+91${phone}`, channel: "sms" });

      logger.info(`OTP sent successfully to ${phone}`);
      return verification;
    } catch (err) {
      logger.error("OTP Send Error:", err.message);
      throw new ApiError(500, "Failed to send OTP");
    }
  },

  verifyOTP: async (phone, otp) => {
    if (!twilioClient) {
      throw new ApiError(500, "Twilio not configured");
    }

    try {
      const verification = await twilioClient.verify.v2
        .services(ENV.TWILIO_VERIFY_SID)
        .verificationChecks.create({ to: `+91${phone}`, code: otp });

      return verification.status === "approved";
    } catch (err) {
      logger.error("OTP Verify Error:", err.message);
      throw new ApiError(400, "Invalid or expired OTP");
    }
  },
};