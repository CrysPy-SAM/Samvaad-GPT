import jwt from "jsonwebtoken";
import { ENV } from "../config/env.js";
import { ApiError } from "../utils/response.js";

// ✅ Full authentication required
export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(401, "No token provided");
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, ENV.JWT_SECRET);

    // ✅ ensure consistent structure (id always present)
    req.user = {
      id: decoded.id || decoded._id,
      email: decoded.email,
    };

    next();
  } catch (err) {
    next(new ApiError(403, "Invalid or expired token"));
  }
};

// ✅ Optional authentication (for guest routes)
export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, ENV.JWT_SECRET);
      req.user = {
        id: decoded.id || decoded._id,
        email: decoded.email,
      };
    } catch {
      req.user = null; // invalid → continue as guest
    }
  } else {
    req.user = null; // no token → guest
  }

  next();
};
