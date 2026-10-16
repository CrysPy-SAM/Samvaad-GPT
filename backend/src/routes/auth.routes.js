import express from "express";
import { authController } from "../controllers/authController.js";
import { validateRegistration } from "../middleware/validator.js";
import { authLimiter } from "../middleware/rateLimit.js";
import { optionalAuth } from "../middleware/auth.js";

const router = express.Router();

router.use(authLimiter);

// Email/Password Auth
router.post("/register", validateRegistration, authController.register);
router.post("/login", authController.login);

// Phone/OTP Auth
router.post("/send-otp", authController.sendOTP);
router.post("/verify-otp", authController.verifyOTP);

// Logout / Session Invalidation
router.post("/logout", optionalAuth, authController.logout);

export default router;