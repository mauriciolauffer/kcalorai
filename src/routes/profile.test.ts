import { describe, it, expect, vi, beforeEach } from "vitest";
import { testClient } from "hono/testing";
import { app } from "../app";
import { sign } from "hono/jwt";

describe("Profile Routes", () => {
  const JWT_SECRET = "test-secret";
  const userId = "test-user-id";
  let token: string;

  const mockDb = {
    prepare: vi.fn().mockReturnThis(),
    bind: vi.fn().mockReturnThis(),
    first: vi.fn(),
  };

  const client = testClient(app, {
    DB: mockDb as any,
    JWT_SECRET,
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    token = await sign(
      {
        sub: userId,
        exp: Math.floor(Date.now() / 1000) + 60 * 60,
      },
      JWT_SECRET,
    );
  });

  it("GET /profile should return 401 if unauthorized", async () => {
    const res = await client.profile.$get();
    expect(res.status).toBe(401);
  });

  it("POST /profile/setup should validate input", async () => {
    const res = await client.profile.setup.$post(
      {
        json: {
          age: 0, // Invalid: @minimum 1
        } as any,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    expect(res.status).toBe(400);
    const data = (await res.json()) as any;
    expect(data.error).toBe("Validation failed");
  });

  it("POST /profile/setup should succeed with valid input", async () => {
    mockDb.first
      .mockResolvedValueOnce({
        user_id: userId,
        profile_completed: 1,
      })
      .mockResolvedValueOnce({
        user_id: userId,
        daily_calories: 2500,
        protein_g: 150,
        fat_g: 70,
        carbs_g: 300,
        effective_from: "2023-01-01",
      });

    const res = await client.profile.setup.$post(
      {
        json: {
          age: 30,
          height_cm: 180,
          weight_kg: 80,
          gender: "male",
          activity_level: "moderately_active",
          goal: "maintain_weight",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.profile.profile_completed).toBe(true);
    expect(data.latest_goal.daily_calories).toBeDefined();
  });

  it("GET /profile should succeed with valid token", async () => {
    mockDb.first.mockResolvedValueOnce({
      user_id: userId,
      profile_completed: 0,
    });

    const res = await client.profile.$get(
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.profile).toBeDefined();
    expect(data.profile.user_id).toBe(userId);
  });
});
