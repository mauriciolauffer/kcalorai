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
      meal: "lunch",
    };
    db.first.mockResolvedValue({ id: "log1", ...logData, name: "Quick Add", user_id: userId });

    const client = testClient(app, { ...env, DB: db } as any);
    const res = await client.food.$post({ json: logData as any });

    expect(res.status).toBe(201);
    const body = (await res.json()) as any;
    expect(body.name).toBe("Quick Add");
    expect(body.calories).toBe(500);
  });

  it("GET /food should return logs for a date", async () => {
    const logs = [{ id: "log1", name: "Apple", calories: 95 }];
    db.all.mockResolvedValue({ results: logs });

    const client = testClient(app, { ...env, DB: db } as any);
    const res = await client.food.$get({ query: { date: "2023-10-27" } });

    expect(res.status).toBe(200);
    const body = await res.json() as any;
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
    const body = await res.json() as any;
    expect(body.name).toBe("Green Apple");
  });

  it("DELETE /food/:id should delete a log", async () => {
    db.run.mockResolvedValue({ meta: { changes: 1 } });

    const client = testClient(app, { ...env, DB: db } as any);
    const res = await client.food[":id"].$delete({
      param: { id: "log1" },
    });

    expect(res.status).toBe(200);
    const body = await res.json() as any;
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
});
