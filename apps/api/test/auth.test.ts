import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { buildTestApp, closeTestResources, resetDatabase } from "./helpers.js";

describe("auth", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await app.close();
    await closeTestResources();
  });

  it("registers a new user and returns tokens", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: "alice@example.com", password: "SuperSecret123!" },
    });
    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.accessToken).toBeTruthy();
    expect(body.refreshToken).toBeTruthy();
    expect(body.user.email).toBe("alice@example.com");
    expect(body.user.role).toBe("user");
  });

  it("rejects a weak password", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: "bob@example.com", password: "short" },
    });
    expect(response.statusCode).toBe(400);
  });

  it("rejects duplicate registration", async () => {
    await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: "carol@example.com", password: "SuperSecret123!" },
    });
    const response = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: "carol@example.com", password: "SuperSecret123!" },
    });
    expect(response.statusCode).toBe(409);
  });

  it("logs in with correct credentials and rejects wrong password", async () => {
    await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: "dave@example.com", password: "SuperSecret123!" },
    });

    const good = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "dave@example.com", password: "SuperSecret123!" },
    });
    expect(good.statusCode).toBe(200);

    const bad = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "dave@example.com", password: "wrong-password" },
    });
    expect(bad.statusCode).toBe(401);
  });

  it("requires a bearer token for /auth/me", async () => {
    const response = await app.inject({ method: "GET", url: "/auth/me" });
    expect(response.statusCode).toBe(401);
  });

  it("returns the current user for a valid token", async () => {
    const register = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: "erin@example.com", password: "SuperSecret123!" },
    });
    const { accessToken } = JSON.parse(register.body);

    const response = await app.inject({
      method: "GET",
      url: "/auth/me",
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.role).toBe("user");
  });

  it("refreshes tokens and rotates the refresh token", async () => {
    const register = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: "frank@example.com", password: "SuperSecret123!" },
    });
    const { refreshToken } = JSON.parse(register.body);

    const refreshed = await app.inject({
      method: "POST",
      url: "/auth/refresh",
      payload: { refreshToken },
    });
    expect(refreshed.statusCode).toBe(200);

    // L'ancien refresh token a ete revoque : un second usage doit echouer.
    const reused = await app.inject({
      method: "POST",
      url: "/auth/refresh",
      payload: { refreshToken },
    });
    expect(reused.statusCode).toBe(401);
  });

  it("invalidates the refresh token on logout", async () => {
    const register = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: "gina@example.com", password: "SuperSecret123!" },
    });
    const { refreshToken } = JSON.parse(register.body);

    const logout = await app.inject({ method: "POST", url: "/auth/logout", payload: { refreshToken } });
    expect(logout.statusCode).toBe(204);

    const refreshed = await app.inject({
      method: "POST",
      url: "/auth/refresh",
      payload: { refreshToken },
    });
    expect(refreshed.statusCode).toBe(401);
  });
});
