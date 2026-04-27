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

describe("User Story 13: View macro goals", () => {
  const userId = "test-user-us13";
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
          user: { id: userId, email: "us13@example.com", name: "US13 User" },
          session: { id: "session-us13" },
        }),
      },
    } as any);
  });

  it("should calculate default macro targets when setting up profile (AC1, AC2)", async () => {
    const setupData = {
      age: 30,
      height_cm: 180,
      weight_kg: 80,
      gender: "male",
      activity_level: "sedentary",
      goal: "maintain_weight",
    };

    // BMR = 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
    // TDEE = 1780 * 1.2 = 2136
    const expectedCalories = 2136;
    const expectedProtein = Math.round((expectedCalories * 0.3) / 4); // 160
    const expectedFat = Math.round((expectedCalories * 0.3) / 9); // 71
    const expectedCarbs = Math.round((expectedCalories * 0.4) / 4); // 214

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
      if (lastQuery.includes("INSERT INTO user_profiles")) {
        return Promise.resolve({ user_id: userId, profile_completed: 1 });
      }
      if (lastQuery.includes("INSERT INTO user_goals")) {
        return Promise.resolve({
          id: "goal-1",
          user_id: userId,
          ...capturedGoal,
          effective_from: "2024-01-01",
        });
      }
      return Promise.resolve(null);
    });

    const client = testClient(app, { ...env, DB: db } as any);
    const res = await client.profile.setup.$post({ json: setupData as any });

    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.latest_goal).toMatchObject({
      daily_calories: expectedCalories,
      protein_g: expectedProtein,
      fat_g: expectedFat,
      carbs_g: expectedCarbs,
    });
  });

  it("should recalculate default macros when manually updating calorie goal (AC1, AC2)", async () => {
    const updateGoalData = {
      daily_calories: 2000,
    };

    // Macros: 30% Protein (150g), 30% Fat (67g), 40% Carbs (200g)
    const expectedProtein = 150;
    const expectedFat = 67;
    const expectedCarbs = 200;

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
          id: "goal-2",
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
          id: "goal-2",
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
      protein_g: expectedProtein,
      fat_g: expectedFat,
      carbs_g: expectedCarbs,
    });
  });

  it("should show macro goals and remaining macros in daily summary (AC3, AC4)", async () => {
    const date = "2024-01-01";
    const goal = {
      daily_calories: 2000,
      protein_g: 150,
      fat_g: 67,
      carbs_g: 200,
    };
    const logs = [
      {
        meal: "breakfast",
        calories: 500,
        protein_g: 40,
        fat_g: 20,
        carbs_g: 40,
      },
    ];

    db.all.mockResolvedValue({ results: logs });
    db.first.mockResolvedValue(goal);

    const client = testClient(app, { ...env, DB: db } as any);
    const res = await client.food.summary.$get({ query: { date } });

    expect(res.status).toBe(200);
    const body = (await res.json()) as any;

    // AC4: Macro goals are visible alongside calorie goals
    expect(body.goal).toMatchObject({
      calories: 2000,
      protein_g: 150,
      fat_g: 67,
      carbs_g: 200,
    });

    // AC3: User can see remaining macros for the day
    // Consumed: 40, 20, 40
    // Remaining: 150-40=110, 67-20=47, 200-40=160
    expect(body.remaining).toMatchObject({
      calories: 1500,
      protein_g: 110,
      fat_g: 47,
      carbs_g: 160,
    });

    expect(body.consumed).toMatchObject({
      calories: 500,
      protein_g: 40,
      fat_g: 20,
      carbs_g: 40,
    });
  });
});
