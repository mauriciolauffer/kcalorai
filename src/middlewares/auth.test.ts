import { describe, it, expect, vi } from "vitest";
import { getUserId } from "./auth";
import { UnauthorizedError } from "../types/errors";

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
