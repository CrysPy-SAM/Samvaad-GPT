import { ApiError } from "../utils/response.js";

export const validateChatMessage = (req, res, next) => {
  const { message } = req.body;
  
  if (!message || typeof message !== "string") {
    return next(new ApiError(400, "Message is required and must be a string"));
  }
  
  if (message.trim().length === 0) {
    return next(new ApiError(400, "Message cannot be empty"));
  }
  
  if (message.length > 4000) {
    return next(new ApiError(400, "Message is too long (max 4000 characters)"));
  }
  
  next();
};

export const validateRegistration = (req, res, next) => {
  const { name, email, password } = req.body;
  
  if (!name || !email || !password) {
    return next(new ApiError(400, "All fields are required"));
  }
  
  if (name.length < 2 || name.length > 50) {
    return next(new ApiError(400, "Name must be between 2-50 characters"));
  }
  
  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(email)) {
    return next(new ApiError(400, "Invalid email format"));
  }
  
  if (password.length < 6) {
    return next(new ApiError(400, "Password must be at least 6 characters"));
  }
  
  next();
};
