import { describe, it, expect, vi } from "vitest";
import { testClient } from "hono/testing";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { app } from "./index";
import { AppError } from "../types/errors";

vi.mock("../lib/auth", () => ({
  getAuth: vi.fn().mockReturnValue({
    api: { getSession: vi.fn().mockResolvedValue(null) },
    handler: vi.fn().mockResolvedValue(new Response("Not Found", { status: 404 })),
  }),
}));

const env = {
  DB: {} as any,
  BETTER_AUTH_SECRET: "test-secret",
  BETTER_AUTH_URL: "http://localhost",
};

describe("API Gateway", () => {
  const client = testClient(app);

  it("should return 200 OK for /health", async () => {
    const res = await client.health.$get();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
  });

  it("should return 200 OK for root path", async () => {
    const res = await client.index.$get();
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("kcalorai API Gateway");
  });

  it("onError should handle AppError with statusCode, message and details", async () => {
    const h = new Hono();
    h.onError((err, c) => {
      if (err instanceof AppError) {
        return c.json(
          { error: err.message, ...(err.details ? { details: err.details } : {}) },
          err.statusCode as any,
        );
      }
      return c.json({ error: "Internal Server Error" }, 500);
    });
    h.get("/boom", () => {
      throw new AppError("oops", 422, { field: "x" });
    });
    const res = await h.fetch(new Request("http://localhost/boom"));
    expect(res.status).toBe(422);
    const body = (await res.json()) as any;
    expect(body.error).toBe("oops");
    expect(body.details).toEqual({ field: "x" });
  });

  it("onError should return HTTPException response", async () => {
    const h = new Hono();
    h.onError((err, c) => {
      if (err instanceof HTTPException) return err.getResponse();
      return c.json({ error: "Internal Server Error" }, 500);
    });
    h.get("/forbidden", () => {
      throw new HTTPException(403, { message: "forbidden" });
    });
    const res = await h.fetch(new Request("http://localhost/forbidden"));
    expect(res.status).toBe(403);
  });

  it("onError on actual app returns 401 for unauthenticated protected routes", async () => {
    const res = await app.request("/profile", {}, env);
    expect(res.status).toBe(401);
  });

  it("onError returns 500 for generic Error", async () => {
    const h = new Hono();
    h.onError((err, c) => {
      if (err instanceof AppError) {
        return c.json({ error: err.message }, err.statusCode as any);
      }
      if (err instanceof HTTPException) {
        return err.getResponse();
      }
      console.error(err);
      return c.json({ error: "Internal Server Error" }, 500);
    });
    h.get("/crash", () => {
      throw new Error("unexpected boom");
    });
    const res = await h.fetch(new Request("http://localhost/crash"));
    expect(res.status).toBe(500);
    const body = (await res.json()) as any;
    expect(body.error).toBe("Internal Server Error");
  });
});
