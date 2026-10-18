import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test_super_secret_jwt_key_for_testing_12345";

const { app } = await import("../server.js");
const User = (await import("../src/models/User.js")).default;
const { connectDB, disconnectDB } = await import("../src/config/database.js");

describe("Authentication & Session Security Tests", () => {
  before(async () => {
    await connectDB();
  });

  after(async () => {
    // Clean up test users
    try {
      await User.deleteMany({ email: /@test-samvaad\.internal$/ });
    } catch (e) {
      // ignore
    }
    await disconnectDB();
  });

  it("Login Error: returns 400 when email or password is missing", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "" });

    assert.equal(res.status, 400);
    assert.match(res.body.error, /Email and password are required/i);
  });

  it("User Enumeration Prevention: returns identical 401 for non-existent email and wrong password", async () => {
    // 1. Non-existent user
    const resNonExistent = await request(app)
      .post("/api/auth/login")
      .send({ email: "doesnotexist999@test-samvaad.internal", password: "wrongpassword123" });

    // 2. Existing user with wrong password
    const testEmail = `user_${Date.now()}@test-samvaad.internal`;
    const user = new User({
      name: "Test User",
      email: testEmail,
      password: "correctpassword123",
    });
    await user.save();

    const resWrongPass = await request(app)
      .post("/api/auth/login")
      .send({ email: testEmail, password: "incorrectpassword999" });

    // Both must return HTTP 401 and the EXACT same error message
    assert.equal(resNonExistent.status, 401);
    assert.equal(resWrongPass.status, 401);
    assert.equal(resNonExistent.body.error, "Invalid email or password");
    assert.equal(resWrongPass.body.error, "Invalid email or password");
  });

  it("Registration Validation: enforces email format and minimum password length", async () => {
    const resBadEmail = await request(app)
      .post("/api/auth/register")
      .send({ name: "Alice", email: "not-an-email", password: "validPassword123" });

    assert.equal(resBadEmail.status, 400);
    assert.match(resBadEmail.body.error, /invalid email/i);

    const resShortPass = await request(app)
      .post("/api/auth/register")
      .send({ name: "Alice", email: "valid@test-samvaad.internal", password: "123" });

    assert.equal(resShortPass.status, 400);
    assert.match(resShortPass.body.error, /password must be at least 6 characters/i);
  });

  it("OTP Validation: rejects invalid phone numbers and malformed OTP codes", async () => {
    const resBadPhone = await request(app)
      .post("/api/auth/send-otp")
      .send({ phone: "123" }); // too short

    assert.equal(resBadPhone.status, 400);
    assert.match(resBadPhone.body.error, /valid phone number/i);

    const resBadOtp = await request(app)
      .post("/api/auth/verify-otp")
      .send({ phone: "9876543210", otp: "abc" }); // not 6 digits

    assert.equal(resBadOtp.status, 400);
    assert.match(resBadOtp.body.error, /6-digit/i);
  });

  it("Token Revocation / Logout: revokes all prior tokens when tokenInvalidatedBefore is updated", async () => {
    const testEmail = `logout_${Date.now()}@test-samvaad.internal`;
    const user = new User({
      name: "Logout Test User",
      email: testEmail,
      password: "validPassword123",
    });
    await user.save();

    // Create a token issued in the past
    const pastIssuedAt = Math.floor(Date.now() / 1000) - 10;
    const token = jwt.sign(
      { id: user._id, email: user.email, iat: pastIssuedAt },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Call logout endpoint with token
    const logoutRes = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${token}`);

    assert.equal(logoutRes.status, 200);
    assert.equal(logoutRes.body.success, true);

    // Verify subsequent protected request with the old token is REJECTED with 401
    const protectedRes = await request(app)
      .get("/api/chat/threads")
      .set("Authorization", `Bearer ${token}`);

    assert.equal(protectedRes.status, 401);
    assert.match(protectedRes.body.error, /Session has been terminated/i);
  });
});

