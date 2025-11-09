import express from "express";
import { authController } from "../controllers/authController.js";
import { validateRegistration } from "../middleware/validator.js";

const router = express.Router();

// Email/Password Auth
router.post("/register", validateRegistration, authController.register);
router.post("/login", authController.login);

// Phone/OTP Auth
router.post("/send-otp", authController.sendOTP);
router.post("/verify-otp", authController.verifyOTP);

export default router;