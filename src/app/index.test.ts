import { describe, it, expect } from "vitest";
import { app } from "./index";

describe("API Gateway", () => {
  it("should return 200 OK for /health", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
  });

  it("should return 200 OK for root path", async () => {
    const res = await app.request("/");
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("kcalorai API Gateway");
  });
});
