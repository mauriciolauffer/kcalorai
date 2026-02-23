import { describe, it, expect, vi, beforeEach } from "vitest";
import { testClient } from "hono/testing";
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
    const client = testClient(app, {
      DB: {} as any,
      JWT_SECRET,
    });
    const res = await client.profile.$get();
    expect(res.status).toBe(401);
  });

  it("POST /profile/setup should validate input", async () => {
    const client = testClient(app, {
      DB: {} as any,
      JWT_SECRET,
    });
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
    const mockDb = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockImplementation(() => {
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

    const client = testClient(app, {
      DB: mockDb as any,
      JWT_SECRET,
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

    const client = testClient(app, {
      DB: mockDb as any,
      JWT_SECRET,
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
