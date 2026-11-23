// eslint-disable-next-line @typescript-eslint/no-require-imports
const { generateKeyPairSync, sign } = require("node:crypto");

const originalFetch = globalThis.fetch;
const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const issuer = "https://accounts.google.com";
const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");

globalThis.fetch = async (input, init) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  if (url === `${issuer}/.well-known/openid-configuration`) {
    return Response.json({
      issuer, authorization_endpoint: `${issuer}/authorize`, token_endpoint: `${issuer}/token`,
      jwks_uri: `${issuer}/keys`, userinfo_endpoint: `${issuer}/userinfo`, response_types_supported: ["code"], subject_types_supported: ["public"],
      id_token_signing_alg_values_supported: ["RS256"], code_challenge_methods_supported: ["S256"],
    });
  }
  if (url === `${issuer}/keys`) {
    return Response.json({ keys: [{ ...publicKey.export({ format: "jwk" }), kid: "test-key", use: "sig", alg: "RS256" }] });
  }
  if (url === `${issuer}/userinfo`) {
    return Response.json({ sub: "test-user", email: "student@example.test", email_verified: true, name: "Bạn Nhỏ" });
  }
  if (url === `${issuer}/token`) {
    const now = Math.floor(Date.now() / 1000);
    const body = `${encode({ alg: "RS256", kid: "test-key" })}.${encode({
      iss: issuer, aud: "test-client", sub: "test-user", iat: now, exp: now + 300,
      email: "student@example.test", email_verified: true, name: "Bạn Nhỏ",
    })}`;
    return Response.json({
      access_token: "mock-access-token", token_type: "Bearer", expires_in: 300,
      id_token: `${body}.${sign("RSA-SHA256", Buffer.from(body), privateKey).toString("base64url")}`,
    });
  }
  return originalFetch(input, init);
};
