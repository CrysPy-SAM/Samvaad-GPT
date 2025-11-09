import jwt from "jsonwebtoken";
import { ENV } from "../config/env.js";
import { ApiError } from "../utils/response.js";

export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(401, "No token provided");
    }

    const token = authHeader.split(" ")[1];
    
    try {
      const decoded = jwt.verify(token, ENV.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      throw new ApiError(403, "Invalid or expired token");
    }
  } catch (error) {
    next(error);
  }
};

export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    
    try {
      const decoded = jwt.verify(token, ENV.JWT_SECRET);
      req.user = decoded;
    } catch (err) {
      // Token invalid, continue as guest
      req.user = null;
    }
  }
  
  next();
};