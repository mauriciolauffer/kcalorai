import { describe, it, expect, vi } from "vitest";
import { testClient } from "hono/testing";
import { app } from "../app";

vi.mock("../lib/auth", () => ({
  getAuth: vi.fn().mockReturnValue({
    api: {
      getSession: vi.fn(),
    },
  }),
}));

import { getAuth } from "../lib/auth";

describe("Profile Routes", () => {
  const userId = "test-user-id";
  const env = {
    DB: {} as any,
    BETTER_AUTH_SECRET: "test-secret",
    BETTER_AUTH_URL: "http://localhost",
    JWT_SECRET: "test-jwt-secret",
  };

  it("GET /profile should return 401 if unauthorized", async () => {
    vi.mocked(getAuth).mockReturnValue({
      api: {
        getSession: vi.fn().mockResolvedValue(null),
      },
    } as any);

    const client = testClient(app, env);
    const res = await client.profile.$get();
    expect(res.status).toBe(401);
  });

  it("POST /profile/setup should validate input", async () => {
    vi.mocked(getAuth).mockReturnValue({
      api: {
        getSession: vi.fn().mockResolvedValue({
          user: { id: userId, email: "test@example.com", name: "Test" },
          session: { id: "session-id" },
        }),
      },
    } as any);

    const client = testClient(app, env);
    const res = await client.profile.setup.$post(
      {
        json: {
          age: 0, // Invalid: @minimum 1
        } as unknown as any,
      },
      {
        headers: {
          cookie: "better-auth.session-token=test-token",
        },
      },
    );

    expect(res.status).toBe(400);
    const data = (await res.json()) as any;
    expect(data.error).toBe("Validation failed");
  });

  it("POST /profile/setup should succeed with valid input", async () => {
    vi.mocked(getAuth).mockReturnValue({
      api: {
        getSession: vi.fn().mockResolvedValue({
          user: { id: userId, email: "test@example.com", name: "Test" },
          session: { id: "session-id" },
        }),
      },
    } as any);

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
      ...env,
      DB: mockDb as any,
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
          cookie: "better-auth.session-token=test-token",
        },
      },
    );

    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.profile.profile_completed).toBe(true);
  });

  it("GET /profile should succeed with valid session", async () => {
    vi.mocked(getAuth).mockReturnValue({
      api: {
        getSession: vi.fn().mockResolvedValue({
          user: { id: userId, email: "test@example.com", name: "Test" },
          session: { id: "session-id" },
        }),
      },
    } as any);

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
      ...env,
      DB: mockDb as any,
    });

    const res = await client.profile.$get(
      {},
      {
        headers: {
          cookie: "better-auth.session-token=test-token",
        },
      },
    );

    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.profile.user_id).toBe(userId);
  });

  it("POST /profile/goal should update the calorie goal", async () => {
    vi.mocked(getAuth).mockReturnValue({
      api: {
        getSession: vi.fn().mockResolvedValue({
          user: { id: userId, email: "test@example.com", name: "Test" },
          session: { id: "session-id" },
        }),
      },
    } as any);

    const mockDb = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockImplementation(() => {
            return Promise.resolve({
              id: "new-goal-id",
              user_id: userId,
              daily_calories: 2000,
              protein_g: 150,
              fat_g: 67,
              carbs_g: 200,
              effective_from: "2023-10-27",
              created_at: "2023-10-27T10:00:00Z",
            });
          }),
        }),
      }),
    };

    const client = testClient(app, {
      ...env,
      DB: mockDb as any,
    });

    const res = await client.profile.goal.$post(
      {
        json: {
          daily_calories: 2000,
          effective_from: "2023-10-27",
        },
      },
      {
        headers: {
          cookie: "better-auth.session-token=test-token",
        },
      },
    );

    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.daily_calories).toBe(2000);
    expect(data.effective_from).toBe("2023-10-27");
  });
});
