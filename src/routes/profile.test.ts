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
      DB: {} as unknown as D1Database,
      JWT_SECRET,
    });
    const res = await client.profile.setup.$post(
      {
        json: {
          age: 0, // Invalid: @minimum 1
        } as unknown as any,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    expect(res.status).toBe(400);
    const data = await res.json();
    if ("error" in data) {
      expect(data.error).toBe("Validation failed");
    } else {
      throw new Error("Expected error response");
    }
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
    const data = await res.json();
    if ("profile" in data && "latest_goal" in data && typeof data.profile === "object" && data.profile !== null && "profile_completed" in data.profile) {
      expect(data.profile.profile_completed).toBe(true);
      expect(data.latest_goal).toBeDefined();
    } else {
      throw new Error("Invalid response body");
    }
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
    const data = await res.json();
    if ("profile" in data && typeof data.profile === "object" && data.profile !== null && "user_id" in data.profile) {
      expect(data.profile.user_id).toBe(userId);
    } else {
      throw new Error("Invalid response body");
    }
  });
});
