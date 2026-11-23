import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { resolve } from "node:path";
import { test } from "node:test";

test("AI routes validate requests and return teacher questions and student help", { timeout: 30000 }, async () => {
  const port = 39973;
  const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(port)], {
    env: { ...process.env, EDIT_PIN: "test-pin", GEMINI_API_KEY: "mock-key", GEMINI_MODEL: "gemini-3.5-flash-lite",
      KV_REST_API_URL: "https://mock-redis.invalid", KV_REST_API_TOKEN: "mock-token",
      NODE_OPTIONS: `--require="${resolve("tests/fixtures/ai-mock.cjs").replaceAll("\\", "\\\\")}"` },
    stdio: "ignore",
  });
  const exited = once(server, "exit");
  try {
    const base = `http://127.0.0.1:${port}`;
    let ready = false;
    for (let i = 0; i < 80; i++) {
      if (server.exitCode !== null) throw new Error(`server exited: ${server.exitCode}`);
      try { if ((await fetch(base, { signal: AbortSignal.timeout(1000) })).ok) { ready = true; break; } } catch { /* waiting for server */ }
      await new Promise((done) => setTimeout(done, 200));
    }
    assert.ok(ready, "server did not start");
    const post = (body, pin) => fetch(`${base}/api/ai`, { method: "POST",
      headers: { "content-type": "application/json", ...(pin ? { "x-edit-pin": pin } : {}) },
      body: JSON.stringify(body),
    });
    const create = { kind: "questions", topic: "phép cộng", level: "Tiểu học", count: 2 };
    assert.equal((await post(create)).status, 401);
    assert.equal((await post({ ...create, count: 11 }, "test-pin")).status, 400);
    const result = await post(create, "test-pin");
    const data = await result.json();
    assert.equal(result.status, 200, JSON.stringify(data));
    assert.equal(data.questions.length, 2);
    assert.equal(data.questions[1].answer, "3");
    assert.equal((await post({ ...create, topic: "mock-invalid" }, "test-pin")).status, 502);
    const flashcards = { kind: "flashcards", topic: "con vật", level: "Tiểu học", count: 2 };
    assert.equal((await post(flashcards)).status, 401);
    assert.equal((await post({ ...flashcards, count: 11 }, "test-pin")).status, 400);
    const cardResult = await post(flashcards, "test-pin");
    const cardData = await cardResult.json();
    assert.equal(cardResult.status, 200, JSON.stringify(cardData));
    assert.deepEqual(cardData.cards[0], { english: "cat", vietnamese: "con mèo", picture: "🐱" });
    assert.equal((await post({ ...flashcards, topic: "mock-invalid" }, "test-pin")).status, 502);
    assert.equal((await post({ kind: "help", question: "" })).status, 400);
    assert.equal((await post({ kind: "help", question: "mock-quota" })).status, 429);
    assert.equal((await post({ kind: "help", question: "mock-blocked" })).status, 502);
    const help = await post({ kind: "help", question: "Làm sao để cộng?" });
    assert.equal(help.status, 200);
    assert.equal((await help.json()).text, "Hãy thử đếm từng vật nhé!");
    assert.equal((await fetch(`${base}/ai`)).status, 200);
  } finally {
    if (server.exitCode === null) server.kill();
    await exited;
  }
});
