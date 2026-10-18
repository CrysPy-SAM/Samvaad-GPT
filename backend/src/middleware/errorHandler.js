import { ENV } from "../config/env.js";

export const errorHandler = (err, req, res, next) => {
  console.error("❌ Error:", err);

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";

  // Handle Multer upload errors
  if (err.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      statusCode = 413;
      message = "File exceeds the maximum allowed size (10MB).";
    } else {
      statusCode = 400;
      message = `Upload error: ${err.message}`;
    }
  } else if (err.message && err.message.includes("CORS")) {
    statusCode = 403;
    message = err.message;
  } else if (err.name === "ValidationError") {
    statusCode = 400;
  }

  const response = {
    success: false,
    error: message,
    ...(ENV.NODE_ENV === "development" && { stack: err.stack }),
  };

  res.status(statusCode).json(response);
};

export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    path: req.path,
    method: req.method,
  });
};