import { describe, it, expect, vi } from "vitest";
import { getUserId, authMiddleware } from "./auth";
import { UnauthorizedError } from "../types/errors";

vi.mock("../lib/auth", () => ({
  getAuth: vi.fn().mockReturnValue({
    api: {
      getSession: vi.fn(),
    },
  }),
}));

describe("getUserId", () => {
  it("throws UnauthorizedError when user is not set", () => {
    const c = { get: vi.fn().mockReturnValue(undefined) } as any;
    expect(() => getUserId(c)).toThrow(UnauthorizedError);
  });

  it("throws UnauthorizedError when user has no id", () => {
    const c = { get: vi.fn().mockReturnValue({ id: undefined }) } as any;
    expect(() => getUserId(c)).toThrow(UnauthorizedError);
  });

  it("returns user id when present", () => {
    const c = { get: vi.fn().mockReturnValue({ id: "user-1" }) } as any;
    expect(getUserId(c)).toBe("user-1");
  });
});

describe("authMiddleware", () => {
  it("throws UnauthorizedError when session is null", async () => {
    const { getAuth } = await import("../lib/auth");
    vi.mocked(getAuth).mockReturnValue({
      api: { getSession: vi.fn().mockResolvedValue(null) },
    } as any);

    const c = {
      executionCtx: {},
      env: {},
      req: { raw: { headers: {} } },
      set: vi.fn(),
    } as any;

    await expect(authMiddleware(c, vi.fn())).rejects.toThrow(UnauthorizedError);
  });

  it("sets user and session and calls next when session is valid", async () => {
    const { getAuth } = await import("../lib/auth");
    const fakeSession = {
      user: { id: "user-1", email: "test@example.com" },
      session: { id: "sess-1" },
    };
    vi.mocked(getAuth).mockReturnValue({
      api: { getSession: vi.fn().mockResolvedValue(fakeSession) },
    } as any);

    const next = vi.fn().mockResolvedValue(undefined);
    const c = {
      executionCtx: {},
      env: {},
      req: { raw: { headers: {} } },
      set: vi.fn(),
    } as any;

    await authMiddleware(c, next);

    expect(c.set).toHaveBeenCalledWith("user", fakeSession.user);
    expect(c.set).toHaveBeenCalledWith("session", fakeSession.session);
    expect(next).toHaveBeenCalled();
  });

  it("handles missing executionCtx gracefully", async () => {
    const { getAuth } = await import("../lib/auth");
    vi.mocked(getAuth).mockReturnValue({
      api: { getSession: vi.fn().mockResolvedValue(null) },
    } as any);

    const c = {
      get executionCtx() {
        throw new Error("not available");
      },
      env: {},
      req: { raw: { headers: {} } },
      set: vi.fn(),
    } as any;

    await expect(authMiddleware(c, vi.fn())).rejects.toThrow(UnauthorizedError);
  });
});
