import { describe, it, expect, vi } from "vitest";
import { testClient } from "hono/testing";
import { app } from "./index";

describe("Auth Routes Integration", () => {
  const mockDB = {
    prepare: vi.fn().mockReturnThis(),
    bind: vi.fn().mockReturnThis(),
    first: vi.fn(),
  };

  const env = {
    DB: mockDB as any,
    JWT_SECRET: "test-secret",
  };

  const client = testClient(app, env);

  it("should return 201 on successful signup", async () => {
    mockDB.first
      .mockResolvedValueOnce(null) // findByEmail
      .mockResolvedValueOnce({ id: "uuid", email: "test@example.com" }); // create

    const res = await client.auth.signup.$post({
      json: {
        email: "test@example.com",
        password: "Password123",
      },
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    if ("token" in body && "user" in body && typeof body.user === "object" && body.user !== null && "email" in body.user) {
      expect(body.user.email).toBe("test@example.com");
    } else {
      throw new Error("Invalid response body");
    }
  });

  it("should return 400 on invalid input", async () => {
    const res = await client.auth.signup.$post({
      json: {
        email: "invalid-email",
        password: "weak",
      },
    });

    expect(res.status).toBe(400);
  });

  it("should return 409 if email already exists", async () => {
    mockDB.first.mockResolvedValueOnce({ id: "1", email: "test@example.com" });

    const res = await client.auth.signup.$post({
      json: {
        email: "test@example.com",
        password: "Password123",
      },
    });

    expect(res.status).toBe(409);
    const body = await res.json();
    if ("error" in body) {
      expect(body.error).toBe("Email already in use");
    } else {
      throw new Error("Expected error response");
    }
  });
});
