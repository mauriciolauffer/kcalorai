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
    });

    const result = await authService.signup(data);

    expect(result.user.email).toBe(data.email);
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
});
