import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { CONSTANTS } from "../config/constants.js";
import { ENV } from "../config/env.js";

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = "uploads/";
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: ENV.MAX_FILE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    if (
      CONSTANTS.FILE_TYPES.ALLOWED.includes(file.mimetype) ||
      file.mimetype.startsWith("text/") ||
      file.mimetype.includes("javascript") ||
      file.mimetype.includes("python")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type"), false);
    }
  },
});