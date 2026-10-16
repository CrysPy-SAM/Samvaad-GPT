import jwt from "jsonwebtoken";
import { ENV } from "../config/env.js";
import { ApiError } from "../utils/response.js";
import User from "../models/User.js";

// ✅ Full authentication required with session invalidation support
export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new ApiError(401, "No authentication token provided"));
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, ENV.JWT_SECRET);
    } catch (jwtErr) {
      return next(new ApiError(401, "Invalid or expired token"));
    }

    const userId = decoded.id || decoded._id;
    if (!userId) {
      return next(new ApiError(401, "Malformed token payload"));
    }

    // Verify user exists and token has not been revoked by a logout action
    const user = await User.findById(userId).select("email tokenInvalidatedBefore");
    if (!user) {
      return next(new ApiError(401, "User session not found or user deleted"));
    }

    if (user.tokenInvalidatedBefore && decoded.iat) {
      const issuedAtMs = decoded.iat * 1000;
      const revokedAtMs = new Date(user.tokenInvalidatedBefore).getTime();
      // Allow 1 second clock-skew tolerance
      if (issuedAtMs < revokedAtMs - 1000) {
        return next(new ApiError(401, "Session has been terminated. Please log in again."));
      }
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
    };

    next();
  } catch (err) {
    next(new ApiError(401, "Authentication failed"));
  }
};

// ✅ Optional authentication (for guest / hybrid routes)
export const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, ENV.JWT_SECRET);
      const userId = decoded.id || decoded._id;

      if (userId) {
        const user = await User.findById(userId).select("email tokenInvalidatedBefore");
        if (user) {
          const issuedAtMs = (decoded.iat || 0) * 1000;
          const revokedAtMs = user.tokenInvalidatedBefore
            ? new Date(user.tokenInvalidatedBefore).getTime()
            : 0;

          if (!revokedAtMs || issuedAtMs >= revokedAtMs - 1000) {
            req.user = {
              id: user._id.toString(),
              email: user.email,
            };
          } else {
            req.user = null;
          }
        } else {
          req.user = null;
        }
      } else {
        req.user = null;
      }
    } catch {
      req.user = null; // invalid → safely continue as guest
    }
  } else {
    req.user = null; // no token → guest
  }

  next();
};
