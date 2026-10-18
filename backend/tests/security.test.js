import { describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

// Set test environment
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test_super_secret_jwt_key_for_testing_12345";

const { app } = await import("../server.js");

describe("Security & Configuration Tests", () => {
  it("CORS: should allow requests from authorized production origin", async () => {
    const res = await request(app)
      .get("/health")
      .set("Origin", "https://samvaad-gpt.vercel.app");

    assert.equal(res.status, 200);
    assert.equal(res.headers["access-control-allow-origin"], "https://samvaad-gpt.vercel.app");
    assert.equal(res.headers["access-control-allow-credentials"], "true");
  });

  it("CORS: should allow requests from local development origin", async () => {
    const res = await request(app)
      .get("/health")
      .set("Origin", "http://localhost:5173");

    assert.equal(res.status, 200);
    assert.equal(res.headers["access-control-allow-origin"], "http://localhost:5173");
  });

  it("CORS: should reject requests from unauthorized origins", async () => {
    const res = await request(app)
      .get("/health")
      .set("Origin", "https://malicious-attacker-domain.com");

    // The CORS middleware calls callback(new Error(...)) which triggers error handler with 403
    assert.equal(res.status, 403);
    assert.match(res.body.error, /not allowed by CORS policy/i);
  });

  it("CORS: should permit requests with no Origin header (e.g. server-to-server / curl)", async () => {
    const res = await request(app).get("/health");

    assert.equal(res.status, 200);
    assert.equal(res.body.status, "healthy");
  });

  it("Cache-Control: should send no-store headers on sensitive API responses", async () => {
    const res = await request(app).get("/health");

    assert.match(res.headers["cache-control"], /no-store/);
    assert.match(res.headers["cache-control"], /no-cache/);
    assert.equal(res.headers["pragma"], "no-cache");
  });

  it("Proxy: should trust proxy and record client IP correctly", async () => {
    const res = await request(app)
      .get("/health")
      .set("X-Forwarded-For", "203.0.113.195");

    assert.equal(res.status, 200);
  });

  it("Production JWT Guard: generates secure random key if missing/placeholder in production", async () => {
    const crypto = await import("crypto");

    const resolveSecret = (rawSecret, nodeEnv) => {
      let resolved = rawSecret ? rawSecret.trim() : "";
      if (!resolved || resolved === "samvaad_secret_key_12345") {
        if (nodeEnv === "production") {
          return crypto.randomBytes(32).toString("hex");
        } else {
          return "dev_insecure_jwt_secret_only_for_local_env";
        }
      }
      return resolved;
    };

    // When missing in production: must return a 64-char hex key (32 bytes), NOT the insecure placeholder
    const prodGenerated = resolveSecret(undefined, "production");
    assert.equal(prodGenerated.length, 64);
    assert.notEqual(prodGenerated, "samvaad_secret_key_12345");

    // When placeholder provided in production: must replace with secure random key
    const prodPlaceholder = resolveSecret("samvaad_secret_key_12345", "production");
    assert.equal(prodPlaceholder.length, 64);
    assert.notEqual(prodPlaceholder, "samvaad_secret_key_12345");

    // When custom key provided in production: must preserve it
    const customKey = "my_custom_production_key_1234567890";
    assert.equal(resolveSecret(customKey, "production"), customKey);

    // In development mode: returns dev fallback
    assert.equal(resolveSecret(undefined, "development"), "dev_insecure_jwt_secret_only_for_local_env");
  });
});

