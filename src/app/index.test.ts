import { describe, it, expect } from "vitest";
import { testClient } from "hono/testing";
import { app } from "./index";

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
});
