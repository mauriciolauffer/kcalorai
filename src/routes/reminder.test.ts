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

describe("Reminder Routes", () => {
  const userId = "test-user-id";
  const env = {
    DB: {} as any,
    BETTER_AUTH_SECRET: "test-secret",
    BETTER_AUTH_URL: "http://localhost",
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

  it("GET /reminders should return settings and reminders", async () => {
    db.first.mockResolvedValue({ user_id: userId, enabled: 1 });
    db.all.mockResolvedValue({ results: [{ id: "1", time: "08:00" }] });

    const client = testClient(app, { ...env, DB: db } as any);
    const res = await client.reminders.$get();

    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.settings.enabled).toBe(true);
    expect(body.reminders).toHaveLength(1);
  });

  it("PATCH /reminders/settings should update enabled state", async () => {
    db.first.mockResolvedValue({ user_id: userId, enabled: 0 });

    const client = testClient(app, { ...env, DB: db } as any);
    const res = await client.reminders.settings.$patch({ json: { enabled: false } });

    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.enabled).toBe(false);
  });

  it("POST /reminders should add a new reminder", async () => {
    db.all.mockResolvedValue({ results: [] }); // No existing
    db.first.mockImplementation(async () => {
      // Return something generic that won't break
      return { id: "new-id", user_id: userId, time: "10:00", enabled: 1 };
    });

    const client = testClient(app, { ...env, DB: db } as any);
    const res = await client.reminders.$post({ json: { time: "10:00" } });

    expect(res.status).toBe(201);
  });

  it("POST /reminders should fail for invalid time format", async () => {
    const client = testClient(app, { ...env, DB: db } as any);
    const res = await client.reminders.$post({ json: { time: "99:99" } as any });

    expect(res.status).toBe(400);
  });
});
