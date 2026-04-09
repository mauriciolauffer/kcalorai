import { describe, it, expect, beforeEach, vi } from "vitest";
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

describe("Food Routes", () => {
  const userId = "test-user-id";
  const env = {
    DB: {} as any,
    BETTER_AUTH_SECRET: "test-secret",
    BETTER_AUTH_URL: "http://localhost",
    JWT_SECRET: "test-jwt-secret",
  };

  let db: any;

  beforeEach(() => {
    db = {
      prepare: vi.fn().mockReturnThis(),
      bind: vi.fn().mockReturnThis(),
      first: vi.fn(),
      run: vi.fn(),
      all: vi.fn(),
    };

    vi.mocked(getAuth).mockReturnValue({
      api: {
        getSession: vi.fn().mockResolvedValue({
          user: { id: userId, email: "test@example.com", name: "Test" },
          session: { id: "session-id" },
        }),
      },
    } as any);
  });

  it("POST /food should log a meal", async () => {
    const logData = {
      name: "Apple",
      calories: 95,
      date: "2023-10-27",
      meal: "snack",
    };
    db.first.mockResolvedValue({ id: "log1", ...logData, user_id: userId });

    const client = testClient(app, { ...env, DB: db } as any);
    const res = await client.food.$post({ json: logData as any });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toMatchObject(logData);
  });

  it("POST /food should log a meal without name (Quick Add)", async () => {
    const logData = {
      calories: 500,
      date: "2023-10-27",
      meal: "lunch" as const,
    };
    db.first.mockResolvedValue({ id: "log1", ...logData, name: "Quick Add", user_id: userId });

    const client = testClient(app, { ...env, DB: db } as any);
    const res = await client.food.$post({ json: logData });

    expect(res.status).toBe(201);
    const body = (await res.json()) as any;
    expect(body.name).toBe("Quick Add");
    expect(body.calories).toBe(500);
  });

  it("POST /food should fail if meal is missing", async () => {
    const logData = {
      calories: 500,
      date: "2023-10-27",
    };

    const client = testClient(app, { ...env, DB: db } as any);
    const res = await client.food.$post({ json: logData as any });

    expect(res.status).toBe(400);
  });

  it("POST /food should fail if calories is missing", async () => {
    const logData = {
      date: "2023-10-27",
      meal: "lunch",
    };

    const client = testClient(app, { ...env, DB: db } as any);
    const res = await client.food.$post({ json: logData as any });

    expect(res.status).toBe(400);
  });

  it("GET /food should return logs for a date", async () => {
    const logs = [{ id: "log1", name: "Apple", calories: 95 }];
    db.all.mockResolvedValue({ results: logs });

    const client = testClient(app, { ...env, DB: db } as any);
    const res = await client.food.$get({ query: { date: "2023-10-27" } });

    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.logs).toEqual(logs);
  });

  it("PATCH /food/:id should update a log", async () => {
    const updateData = { name: "Green Apple" };
    db.first.mockResolvedValue({ id: "log1", name: "Green Apple", calories: 95 });

    const client = testClient(app, { ...env, DB: db } as any);
    const res = await client.food[":id"].$patch({
      param: { id: "log1" },
      json: updateData,
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.name).toBe("Green Apple");
  });

  it("DELETE /food/:id should delete a log", async () => {
    db.run.mockResolvedValue({ meta: { changes: 1 } });

    const client = testClient(app, { ...env, DB: db } as any);
    const res = await client.food[":id"].$delete({
      param: { id: "log1" },
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.success).toBe(true);
  });

  it("GET /food/search should search foods and include calories/serving data", async () => {
    const results = [
      {
        id: "f1",
        name: "Apple",
        calories: 95,
        serving_grams: 182,
        protein_g: 0.5,
        fat_g: 0.3,
        carbs_g: 25,
      },
    ];
    db.all.mockResolvedValue({ results });

    const client = testClient(app, { ...env, DB: db } as any);
    const res = await client.food.search.$get({ query: { q: "apple" } });

    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.results[0]).toMatchObject({
      name: "Apple",
      calories: 95,
      serving_grams: 182,
    });
  });

  it("GET /food/items/:id should get a food item", async () => {
    const item = { id: "f1", name: "Apple" };
    db.first.mockResolvedValue(item);

    const client = testClient(app, { ...env, DB: db } as any);
    const res = await client.food.items[":id"].$get({ param: { id: "f1" } });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(item);
  });

  describe("GET /food/summary", () => {
    it("should return daily summary with goals and remaining values", async () => {
      const date = "2023-10-27";
      const logs = [
        {
          id: "log1",
          meal: "breakfast",
          calories: 300,
          protein_g: 20,
          fat_g: 10,
          carbs_g: 30,
        },
        { id: "log2", meal: "lunch", calories: 500, protein_g: 30, fat_g: 15, carbs_g: 60 },
      ];
      const goal = {
        daily_calories: 2000,
        protein_g: 150,
        fat_g: 70,
        carbs_g: 200,
      };

      db.all.mockResolvedValue({ results: logs });
      db.first.mockResolvedValue(goal);

      const client = testClient(app, { ...env, DB: db } as any);
      const res = await client.food.summary.$get({ query: { date } });

      expect(res.status).toBe(200);
      const body = (await res.json()) as any;

      expect(body.date).toBe(date);
      expect(body.consumed.calories).toBe(800);
      expect(body.consumed.protein_g).toBe(50);
      expect(body.goal.calories).toBe(2000);
      expect(body.remaining.calories).toBe(1200);
      expect(body.meals).toHaveLength(4);
      expect(body.meals.find((m: any) => m.meal === "breakfast").calories).toBe(300);
    });

    it("should handle summary when no goal is set", async () => {
      const date = "2023-10-27";
      db.all.mockResolvedValue({ results: [] });
      db.first.mockResolvedValue(null);

      const client = testClient(app, { ...env, DB: db } as any);
      const res = await client.food.summary.$get({ query: { date } });

      expect(res.status).toBe(200);
      const body = (await res.json()) as any;
      expect(body.goal).toBeNull();
      expect(body.remaining).toBeNull();
      expect(body.consumed.calories).toBe(0);
    });

    it("should allow remaining calories to be negative when goal is exceeded", async () => {
      const date = "2023-10-27";
      const logs = [{ id: "log1", meal: "lunch", calories: 2500, protein_g: 0, fat_g: 0, carbs_g: 0 }];
      const goal = { daily_calories: 2000, protein_g: 150, fat_g: 70, carbs_g: 200 };

      db.all.mockResolvedValue({ results: logs });
      db.first.mockResolvedValue(goal);

      const client = testClient(app, { ...env, DB: db } as any);
      const res = await client.food.summary.$get({ query: { date } });

      expect(res.status).toBe(200);
      const body = (await res.json()) as any;
      expect(body.consumed.calories).toBe(2500);
      expect(body.remaining.calories).toBe(-500);
    });

    it("should correctly aggregate all meal types and ignore other days", async () => {
      const date = "2023-10-27";
      const logs = [
        { id: "log1", meal: "breakfast", calories: 100, protein_g: 0, fat_g: 0, carbs_g: 0 },
        { id: "log2", meal: "lunch", calories: 200, protein_g: 0, fat_g: 0, carbs_g: 0 },
        { id: "log3", meal: "dinner", calories: 300, protein_g: 0, fat_g: 0, carbs_g: 0 },
        { id: "log4", meal: "snack", calories: 400, protein_g: 0, fat_g: 0, carbs_g: 0 },
      ];
      db.all.mockResolvedValue({ results: logs });

      const client = testClient(app, { ...env, DB: db } as any);
      const res = await client.food.summary.$get({ query: { date } });

      expect(res.status).toBe(200);
      const body = (await res.json()) as any;
      expect(body.consumed.calories).toBe(1000);
      expect(body.meals).toHaveLength(4);
      expect(body.meals.find((m: any) => m.meal === "breakfast").calories).toBe(100);
      expect(body.meals.find((m: any) => m.meal === "lunch").calories).toBe(200);
      expect(body.meals.find((m: any) => m.meal === "dinner").calories).toBe(300);
      expect(body.meals.find((m: any) => m.meal === "snack").calories).toBe(400);

      // The filtering logic happens in the repository and service, but here we've mocked the results to match our expectations.
      // We'll verify the service filtering in a unit test or through the mock interaction.
      expect(db.all).toHaveBeenCalled();
      const bindCall = db.bind.mock.calls.find((call: any) => call.includes(date));
      expect(bindCall).toBeDefined();
    });
  });

  describe("GET /food/weekly-summary", () => {
    it("should return weekly trends and averages", async () => {
      const endDate = "2024-01-07";
      const logs = [
        {
          date: "2024-01-01",
          calories: 1000,
          protein_g: 10,
          fat_g: 10,
          carbs_g: 10,
        },
        {
          date: "2024-01-07",
          calories: 1100,
          protein_g: 20,
          fat_g: 20,
          carbs_g: 20,
        },
      ];

      db.all.mockResolvedValue({ results: logs });

      const client = testClient(app, { ...env, DB: db } as any);
      const res = await client.food["weekly-summary"].$get({ query: { endDate } });

      expect(res.status).toBe(200);
      const body = (await res.json()) as any;

      expect(body.days).toHaveLength(7);
      expect(body.days[0].date).toBe("2024-01-01");
      expect(body.days[6].date).toBe("2024-01-07");
      expect(body.average.calories).toBe(300);
      expect(body.average.protein_g).toBe(4.3);
    });

    it("should use current date as default endDate", async () => {
      const today = new Date().toISOString().split("T")[0];
      db.all.mockResolvedValue({ results: [] });

      const client = testClient(app, { ...env, DB: db } as any);
      const res = await client.food["weekly-summary"].$get({ query: {} });

      expect(res.status).toBe(200);
      const body = (await res.json()) as any;
      expect(body.days[6].date).toBe(today);
    });

    it("should fail for invalid date format", async () => {
      const client = testClient(app, { ...env, DB: db } as any);
      const res = await client.food["weekly-summary"].$get({ query: { endDate: "invalid-date" } });

      expect(res.status).toBe(400);
    });
  });
});
