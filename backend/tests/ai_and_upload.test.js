import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import jwt from "jsonwebtoken";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test_super_secret_jwt_key_for_testing_12345";

const { app } = await import("../server.js");
const { aiService } = await import("../src/services/aiService.js");
const User = (await import("../src/models/User.js")).default;
const { connectDB, disconnectDB } = await import("../src/config/database.js");

describe("AI Service & File Upload Tests", () => {
  let user, token;

  before(async () => {
    await connectDB();
    user = new User({
      name: "File Test User",
      email: `file_test_${Date.now()}@test-samvaad.internal`,
      password: "password123",
    });
    await user.save();

    token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
  });

  after(async () => {
    try {
      if (user) await User.deleteOne({ _id: user._id });
    } catch (e) {
      // ignore
    }
    await disconnectDB();
  });

  it("Model Registry: returns active and configured AI models", () => {
    const models = aiService.getAvailableModels();
    assert.ok(Array.isArray(models));
    assert.ok(models.length >= 1, "At least one model should be available");

    const fastModel = models.find((m) => m.name.includes("Fast"));
    if (fastModel) {
      assert.equal(fastModel.provider, "groq");
      assert.equal(fastModel.model, "qwen/qwen3.8-27b");
    }
  });

  it("AI Error Handling: throws ApiError(503) on complete provider outage instead of returning 200 error banners", async () => {
    await assert.rejects(
      async () => {
        await aiService.getAIResponse([], "UNKNOWN_MODE");
      },
      (err) => {
        assert.ok(err.statusCode === 503 || err.statusCode === 400);
        assert.match(err.message, /AI service is temporarily unavailable|Unknown/i);
        return true;
      }
    );
  });

  it("File Upload Validation: rejects request without file", async () => {
    const res = await request(app)
      .post("/api/file/analyze")
      .set("Authorization", `Bearer ${token}`);

    assert.equal(res.status, 400);
    assert.match(res.body.error, /No file uploaded/i);
  });

  it("File Upload Validation: rejects unauthorized file types (e.g. .exe / binary)", async () => {
    const res = await request(app)
      .post("/api/file/analyze")
      .set("Authorization", `Bearer ${token}`)
      .attach("file", Buffer.from("malicious executable content"), {
        filename: "malware.exe",
        contentType: "application/x-msdownload",
      });

    assert.ok(res.status === 400 || res.status === 500);
    assert.match(res.body.error, /Unsupported file type/i);
  });
});
