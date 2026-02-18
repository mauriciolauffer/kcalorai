import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthService } from "./auth.service";

describe("AuthService", () => {
  let userRepository: any;
  let authService: AuthService;
  const JWT_SECRET = "test-secret";

  beforeEach(() => {
    userRepository = {
      findByEmail: vi.fn(),
      create: vi.fn(),
    };
    authService = new AuthService(userRepository, JWT_SECRET);
  });

  it("should signup a new user", async () => {
    const data = { email: "test@example.com", password: "Password123" };
    userRepository.findByEmail.mockResolvedValue(null);
    userRepository.create.mockResolvedValue({
      id: "uuid",
      email: data.email,
    });

    const result = await authService.signup(data);

    expect(result.user.email).toBe(data.email);
    expect(result.token).toBeDefined();
    expect(userRepository.create).toHaveBeenCalled();
  });

  it("should throw error if email already in use", async () => {
    const data = { email: "test@example.com", password: "Password123" };
    userRepository.findByEmail.mockResolvedValue({ id: "1" });

    await expect(authService.signup(data)).rejects.toThrow("Email already in use");
  });
});
