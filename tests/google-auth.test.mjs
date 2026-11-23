import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { resolve } from "node:path";
import { test } from "node:test";

test("Google sign-in is optional and its session can be created and ended", { timeout: 30000 }, async () => {
  const port = 39974;
  const base = `http://localhost:${port}`;
  const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(port)], {
    env: {
      ...process.env, AUTH_URL: base, AUTH_SECRET: "test-secret-at-least-32-characters-long",
      AUTH_GOOGLE_ID: "test-client", AUTH_GOOGLE_SECRET: "test-client-secret",
      NODE_OPTIONS: `--require="${resolve("tests/fixtures/google-auth-mock.cjs").replaceAll("\\", "\\\\")}"`,
    },
    stdio: "ignore",
  });
  const exited = once(server, "exit");
  const cookies = new Map();
  async function request(path, options = {}) {
    const response = await fetch(`${base}${path}`, {
      ...options, redirect: "manual", headers: { ...options.headers, cookie: [...cookies].map(([k, v]) => `${k}=${v}`).join("; ") },
    });
    for (const header of response.headers.getSetCookie()) {
      const [pair] = header.split(";");
      const index = pair.indexOf("=");
      cookies.set(pair.slice(0, index), pair.slice(index + 1));
    }
    return response;
  }
  try {
    let ready = false;
    for (let i = 0; i < 80; i++) {
      if (server.exitCode !== null) throw new Error(`server exited: ${server.exitCode}`);
      try { if ((await request("/")).ok) { ready = true; break; } } catch { /* waiting for server */ }
      await new Promise((done) => setTimeout(done, 200));
    }
    assert.ok(ready, "server did not start");
    assert.match(await (await request("/")).text(), /Đăng nhập bằng Google/);
    assert.equal(await (await request("/api/auth/session")).json(), null);
    assert.equal((await request("/join")).status, 200);
    const invalidCsrf = await request("/api/auth/signin/google", {
      method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ csrfToken: "invalid" }),
    });
    assert.match(invalidCsrf.headers.get("location"), /MissingCSRF/);
    const csrf = (await (await request("/api/auth/csrf")).json()).csrfToken;
    const start = await request("/api/auth/signin/google", {
      method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ csrfToken: csrf, callbackUrl: base }),
    });
    assert.equal(start.status, 302);
    const authorization = new URL(start.headers.get("location"));
    assert.equal(authorization.origin, "https://accounts.google.com");
    assert.equal(authorization.searchParams.get("client_id"), "test-client");
    assert.equal(authorization.searchParams.get("redirect_uri"), `${base}/api/auth/callback/google`);
    const callback = await request(`/api/auth/callback/google?${new URLSearchParams({ code: "test-code", state: authorization.searchParams.get("state") })}`);
    assert.equal(callback.status, 302);
    assert.equal(new URL(callback.headers.get("location")).pathname, "/");
    const session = await (await request("/api/auth/session")).json();
    assert.equal(session.user.name, "Bạn Nhỏ");
    const signedInPage = await (await request("/")).text();
    assert.match(signedInPage, /Bạn Nhỏ/);
    assert.match(signedInPage, /Đăng xuất/);
    const signoutCsrf = (await (await request("/api/auth/csrf")).json()).csrfToken;
    const logout = await request("/api/auth/signout", {
      method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ csrfToken: signoutCsrf, callbackUrl: base }),
    });
    assert.equal(logout.status, 302);
    assert.equal(await (await request("/api/auth/session")).json(), null);
  } finally {
    if (server.exitCode === null) server.kill();
    await exited;
  }
});

test("missing Google configuration leaves the app available", { timeout: 30000 }, async () => {
  const port = 39975;
  const base = `http://localhost:${port}`;
  const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(port)], {
    env: { ...process.env, AUTH_URL: "", AUTH_SECRET: "", AUTH_GOOGLE_ID: "", AUTH_GOOGLE_SECRET: "" },
    stdio: "ignore",
  });
  const exited = once(server, "exit");
  try {
    let response;
    for (let i = 0; i < 80; i++) {
      if (server.exitCode !== null) throw new Error(`server exited: ${server.exitCode}`);
      try { response = await fetch(base, { signal: AbortSignal.timeout(1000) }); break; } catch { /* waiting for server */ }
      await new Promise((done) => setTimeout(done, 200));
    }
    assert.ok(response?.ok, "server did not start");
    assert.match(await response.text(), /Đăng nhập Google chưa được cấu hình/);
    assert.equal((await fetch(`${base}/api/auth/session`)).status, 503);
    assert.equal((await fetch(`${base}/join`)).status, 200);
  } finally {
    if (server.exitCode === null) server.kill();
    await exited;
  }
});
