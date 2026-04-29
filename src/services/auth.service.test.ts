import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthService } from "./auth.service";

describe("AuthService", () => {
  let auth: any;
  let authService: AuthService;

  beforeEach(() => {
    auth = {
      api: {
        signUpEmail: vi.fn(),
      },
    };
    authService = new AuthService(auth);
  });

  it("should signup a new user", async () => {
    const data = { name: "Test User", email: "test@example.com", password: "Password123" };
    auth.api.signUpEmail.mockResolvedValue({
      user: {
        id: "uuid",
        email: data.email,
        name: data.name,
      },
      token: "test-token",
    });

    const result = await authService.signup(data);

    expect(result.user.email).toBe(data.email);
    expect(result.token).toBe("test-token");
    expect(auth.api.signUpEmail).toHaveBeenCalledWith({
      body: {
        email: data.email,
        password: data.password,
        name: data.name,
      },
    });
  });

  it("should throw error if signup fails", async () => {
    const data = { name: "Test User", email: "test@example.com", password: "Password123" };
    auth.api.signUpEmail.mockResolvedValue(null);

    await expect(authService.signup(data)).rejects.toThrow("Failed to signup");
  });

  it("should throw ConflictError when email is already in use", async () => {
    const data = { name: "Test User", email: "test@example.com", password: "Password123" };
    const apiError = Object.assign(new Error("Email already in use"), {
      status: 422,
    });
    Object.setPrototypeOf(apiError, (await import("better-auth/api")).APIError.prototype);
    auth.api.signUpEmail.mockRejectedValue(apiError);

    const { ConflictError } = await import("../types/errors");
    await expect(authService.signup(data)).rejects.toThrow(ConflictError);
  });

  it("should re-throw unknown errors", async () => {
    const data = { name: "Test User", email: "test@example.com", password: "Password123" };
    const unknown = new Error("network failure");
    auth.api.signUpEmail.mockRejectedValue(unknown);

    await expect(authService.signup(data)).rejects.toThrow("network failure");
  });
});
