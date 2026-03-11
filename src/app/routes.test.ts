import { describe, it, expect, vi } from "vitest";
import { app } from "./index";

vi.mock("../lib/auth", () => ({
  getAuth: vi.fn().mockReturnValue({
    handler: vi.fn(),
  }),
}));

import { getAuth } from "../lib/auth";

describe("Auth Routes Integration", () => {
  const env = {
    DB: {} as any,
    BETTER_AUTH_SECRET: "test-secret",
    BETTER_AUTH_URL: "http://localhost",
    JWT_SECRET: "test-jwt-secret",
  };

  it("should call better-auth handler", async () => {
    const mockHandler = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }));
    vi.mocked(getAuth).mockReturnValue({
      handler: mockHandler,
    } as any);

    // Using app.request to avoid RPC issues with catch-all Better Auth handler
    const res = await app.request(
      "/auth/signup-email",
      {
        method: "POST",
        body: JSON.stringify({
          email: "test@example.com",
          password: "Password123",
          name: "Test User",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      },
      env,
    );

    expect(res.status).toBe(200);
    expect(mockHandler).toHaveBeenCalled();
  });

  it("should return 404 for unknown auth routes if handler returns 404", async () => {
    const mockHandler = vi.fn().mockResolvedValue(new Response("Not Found", { status: 404 }));
    vi.mocked(getAuth).mockReturnValue({
      handler: mockHandler,
    } as any);

    const res = await app.request("/auth/unknown", {}, env);

    expect(res.status).toBe(404);
  });
});
