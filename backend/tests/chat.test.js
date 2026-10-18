import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test_super_secret_jwt_key_for_testing_12345";

const { app } = await import("../server.js");
const User = (await import("../src/models/User.js")).default;
const Thread = (await import("../src/models/Thread.js")).default;
const { connectDB, disconnectDB } = await import("../src/config/database.js");

describe("Chat & Thread Query Optimization Tests", () => {
  let userA, userB, tokenA, tokenB;

  before(async () => {
    await connectDB();

    userA = new User({
      name: "User A",
      email: `user_a_${Date.now()}@test-samvaad.internal`,
      password: "password123",
    });
    await userA.save();

    userB = new User({
      name: "User B",
      email: `user_b_${Date.now()}@test-samvaad.internal`,
      password: "password123",
    });
    await userB.save();

    tokenA = jwt.sign({ id: userA._id, email: userA.email }, process.env.JWT_SECRET, { expiresIn: "1h" });
    tokenB = jwt.sign({ id: userB._id, email: userB.email }, process.env.JWT_SECRET, { expiresIn: "1h" });
  });

  after(async () => {
    try {
      await User.deleteMany({ email: /@test-samvaad\.internal$/ });
      await Thread.deleteMany({ userId: { $in: [userA?._id, userB?._id] } });
    } catch (e) {
      // ignore
    }
    await disconnectDB();
  });

  it("Authorization: rejects unauthorized access to threads endpoint without Bearer token", async () => {
    const res = await request(app).get("/api/chat/threads");
    assert.equal(res.status, 401);
  });

  it("User Isolation: User B cannot view User A's thread", async () => {
    const threadA = new Thread({
      threadId: uuidv4(),
      title: "Secret Thread A",
      userId: userA._id,
      messages: [{ role: "user", content: "Top secret information" }],
    });
    await threadA.save();

    // User B tries to access User A's thread
    const res = await request(app)
      .get(`/api/chat/threads/${threadA.threadId}`)
      .set("Authorization", `Bearer ${tokenB}`);

    assert.equal(res.status, 404);
    assert.match(res.body.error, /Thread not found/i);
  });

  it("Query Optimization: thread list aggregation returns messageCount & lastMessage without wire messages array", async () => {
    const threadId = uuidv4();
    const longContent = "A".repeat(200);

    const thread = new Thread({
      threadId,
      title: "Performance Test Thread",
      userId: userA._id,
      messages: [
        { role: "user", content: "First message" },
        { role: "assistant", content: "Second message" },
        { role: "user", content: longContent },
      ],
    });
    await thread.save();

    const res = await request(app)
      .get("/api/chat/threads")
      .set("Authorization", `Bearer ${tokenA}`);

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.threads));

    const found = res.body.threads.find((t) => t.threadId === threadId);
    assert.ok(found, "Created thread should appear in thread list");

    // Verify optimized fields
    assert.equal(found.messageCount, 3);
    assert.ok(typeof found.lastMessage === "string");
    // lastMessage must be truncated to max 100 characters by MongoDB aggregation
    assert.ok(found.lastMessage.length <= 100);
    // CRITICAL: messages array must NOT be transmitted over the wire in thread list
    assert.equal(found.messages, undefined);
  });

  it("Message Validation: rejects empty messages or messages exceeding character limits", async () => {
    const resEmpty = await request(app)
      .post("/api/chat/message")
      .send({ message: "   " });

    assert.equal(resEmpty.status, 400);

    const resTooLong = await request(app)
      .post("/api/chat/message")
      .send({ message: "X".repeat(4001) });

    assert.equal(resTooLong.status, 400);
    assert.match(resTooLong.body.error, /too long/i);
  });
});

