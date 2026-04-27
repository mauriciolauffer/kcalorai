import { describe, it, expect, beforeEach, vi } from "vitest";
import { testClient } from "hono/testing";
import { app } from "../app";
import { Temporal } from "temporal-polyfill";

vi.mock("../lib/auth", () => ({
  getAuth: vi.fn().mockReturnValue({
    api: {
      getSession: vi.fn(),
    },
  }),
}));

import { getAuth } from "../lib/auth";

describe("User Story 14: Customize macro targets", () => {
  const userId = "test-user-us14";
  const env = {
    DB: {} as any,
    BETTER_AUTH_SECRET: "test-secret",
    BETTER_AUTH_URL: "http://localhost",
  };

  let db: any;
  let lastQuery = "";

  beforeEach(() => {
    lastQuery = "";
    db = {
      prepare: vi.fn().mockImplementation((q) => {
        lastQuery = q;
        return db;
      }),
      bind: vi.fn().mockReturnThis(),
      first: vi.fn(),
      all: vi.fn(),
    };

    vi.mocked(getAuth).mockReturnValue({
      api: {
        getSession: vi.fn().mockResolvedValue({
          user: { id: userId, email: "us14@example.com", name: "US14 User" },
          session: { id: "session-us14" },
        }),
      },
    } as any);
  });

  it("should allow manually adjusting protein, fat, and carb targets (AC1, AC3)", async () => {
    const updateGoalData = {
      daily_calories: 2000,
      protein_g: 150,
      fat_g: 67, // 67*9 = 603
      carbs_g: 200, // 150*4 + 200*4 + 603 = 600 + 800 + 603 = 2003 (within 5% of 2000)
    };

    let capturedGoal: any = null;
    db.bind.mockImplementation((...args: any[]) => {
      if (lastQuery.includes("INSERT INTO user_goals")) {
        capturedGoal = {
          daily_calories: args[2],
          protein_g: args[3],
          fat_g: args[4],
          carbs_g: args[5],
        };
      }
      return db;
    });

    db.first.mockImplementation(() => {
      if (lastQuery.includes("INSERT INTO user_goals")) {
        return Promise.resolve({
          id: "goal-new",
          user_id: userId,
          ...capturedGoal,
          effective_from: "2024-01-01",
        });
      }
      if (lastQuery.includes("SELECT * FROM user_profiles")) {
        return Promise.resolve({ user_id: userId, profile_completed: 1 });
      }
      if (lastQuery.includes("SELECT * FROM user_goals")) {
        return Promise.resolve({
          id: "goal-new",
          user_id: userId,
          ...capturedGoal,
          effective_from: "2024-01-01",
        });
      }
      return Promise.resolve(null);
    });

    const client = testClient(app, { ...env, DB: db } as any);
    const res = await client.profile.goal.$post({ json: updateGoalData as any });

    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.latest_goal).toMatchObject({
      daily_calories: 2000,
      protein_g: 150,
      fat_g: 67,
      carbs_g: 200,
    });
  });

  it("should fail if macros do not align with total calories (AC2)", async () => {
    const updateGoalData = {
      daily_calories: 2000,
      protein_g: 100, // 400
      fat_g: 50,    // 450
      carbs_g: 100,  // 400
      // Total = 1250 kcal, far from 2000
    };

    const client = testClient(app, { ...env, DB: db } as any);
    const res = await client.profile.goal.$post({ json: updateGoalData as any });

    expect(res.status).toBe(400);
    const body = (await res.json()) as any;
    expect(body.error).toContain("Custom macros");
    expect(body.error).toContain("do not align");
  });

  it("should maintain historical macro data when adding a new goal (AC4)", async () => {
    // This is more of a repository/service level check, but we can verify that
    // the new goal has its own effective_from and doesn't overwrite older ones.
    const historicalGoal = {
      id: "goal-old",
      user_id: userId,
      daily_calories: 1800,
      protein_g: 135,
      fat_g: 60,
      carbs_g: 180,
      effective_from: "2023-12-01",
    };

    const newGoalData = {
      daily_calories: 2000,
      protein_g: 150,
      fat_g: 67,
      carbs_g: 200,
      effective_from: "2024-01-01",
    };

    db.first.mockImplementation((q: string) => {
      if (lastQuery.includes("SELECT * FROM user_goals") && lastQuery.includes("effective_from <= ?")) {
        // Mock getGoalByDate
        return Promise.resolve(historicalGoal);
      }
      if (lastQuery.includes("INSERT INTO user_goals")) {
        return Promise.resolve({ ...newGoalData, id: "goal-new" });
      }
      if (lastQuery.includes("SELECT * FROM user_profiles")) {
        return Promise.resolve({ user_id: userId, profile_completed: 1 });
      }
      if (lastQuery.includes("SELECT * FROM user_goals") && lastQuery.includes("ORDER BY effective_from DESC")) {
        return Promise.resolve({ ...newGoalData, id: "goal-new" });
      }
      return Promise.resolve(null);
    });

    const client = testClient(app, { ...env, DB: db } as any);

    // 1. Update goal for 2024-01-01
    const res = await client.profile.goal.$post({ json: newGoalData as any });
    expect(res.status).toBe(200);

    // 2. Query for historical summary (simulated via Food Summary which uses getGoalByDate)
    // We'll directly test the service/repository via route if possible,
    // but the summary endpoint is a good place to verify AC4.

    db.all.mockResolvedValue({ results: [] }); // No food logs

    const summaryRes = await client.food.summary.$get({ query: { date: "2023-12-15" } });
    expect(summaryRes.status).toBe(200);
    const summaryBody = (await summaryRes.json()) as any;

    expect(summaryBody.goal.calories).toBe(1800);
    expect(summaryBody.goal.protein_g).toBe(135);
  });
});
