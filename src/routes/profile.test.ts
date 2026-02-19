import { describe, it, expect, vi, beforeEach } from "vitest";
import { env } from "cloudflare:test";
import { app } from "../app";
import { sign } from "hono/jwt";

describe("Profile Routes", () => {
  const JWT_SECRET = "test-secret";
  const userId = "test-user-id";
  let token: string;

  beforeEach(async () => {
    token = await sign(
      {
        sub: userId,
        exp: Math.floor(Date.now() / 1000) + 60 * 60,
      },
      JWT_SECRET,
    );
  });

  it("GET /profile should return 401 if unauthorized", async () => {
    const res = await app.request(
      "/profile",
      {},
      {
        ...env,
        JWT_SECRET,
      },
    );
    expect(res.status).toBe(401);
  });

  it("POST /profile/setup should validate input", async () => {
    const res = await app.request(
      "/profile/setup",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          age: 0, // Invalid: @minimum 1
        }),
      },
      {
        ...env,
        JWT_SECRET,
      },
    );

    expect(res.status).toBe(400);
    const data = (await res.json()) as any;
    expect(data.error).toBe("Validation failed");
  });

  it("POST /profile/setup should succeed with valid input", async () => {
    const mockDb = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockImplementation(() => {
            // This mock returns whatever the caller expects for simplicity
            // in this test we just want to see it reach the end
            return Promise.resolve({
              user_id: userId,
              profile_completed: 1,
              daily_calories: 2500,
              protein_g: 150,
              fat_g: 70,
              carbs_g: 300,
              effective_from: "2023-01-01",
            });
          }),
        }),
      }),
    };

    const res = await app.request(
      "/profile/setup",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          age: 30,
          height_cm: 180,
          weight_kg: 80,
          gender: "male",
          activity_level: "moderately_active",
          goal: "maintain_weight",
        }),
      },
      {
        ...env,
        DB: mockDb as any,
        JWT_SECRET,
      },
    );

    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.profile.profile_completed).toBe(true);
    expect(data.latest_goal.daily_calories).toBeDefined();
  });

  it("GET /profile should succeed with valid token", async () => {
    const mockDb = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockImplementation(() => {
            return Promise.resolve({
              user_id: userId,
              profile_completed: 0,
            });
          }),
        }),
      }),
    };

    const res = await app.request(
      "/profile",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      {
        ...env,
        DB: mockDb as any,
        JWT_SECRET,
      },
    );

    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.profile).toBeDefined();
    expect(data.profile.user_id).toBe(userId);
  });
});
