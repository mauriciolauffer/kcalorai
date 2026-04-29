import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserRepository } from "./user.repository";

describe("UserRepository", () => {
  let db: any;
  let repository: UserRepository;

  beforeEach(() => {
    db = {
      prepare: vi.fn().mockReturnThis(),
      bind: vi.fn().mockReturnThis(),
      first: vi.fn(),
    };
    repository = new UserRepository(db);
  });

  it("should create a user", async () => {
    const user = { id: "1", name: "Test", email: "test@example.com", password_hash: "hash" };
    db.first.mockResolvedValue({ ...user, created_at: "now", updated_at: "now" });

    const result = await repository.create(user);

    expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO users"));
    expect(db.bind).toHaveBeenCalledWith(user.id, user.name, user.email, user.password_hash);
    expect(result.email).toBe(user.email);
  });

  it("should find a user by email", async () => {
    const email = "test@example.com";
    db.first.mockResolvedValue({ id: "1", email });

    const result = await repository.findByEmail(email);

    expect(db.prepare).toHaveBeenCalledWith(
      expect.stringContaining("SELECT * FROM users WHERE email = ?"),
    );
    expect(db.bind).toHaveBeenCalledWith(email);
    expect(result?.email).toBe(email);
  });

  it("should throw when create returns null", async () => {
    db.first.mockResolvedValue(null);
    await expect(
      repository.create({ id: "1", name: "T", email: "t@t.com", password_hash: "h" }),
    ).rejects.toThrow("Failed to create user");
  });

  it("should find a user by id", async () => {
    db.first.mockResolvedValue({ id: "1", email: "t@t.com" });
    const result = await repository.findById("1");
    expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining("WHERE id = ?"));
    expect(result?.id).toBe("1");
  });

  it("should return null when findByEmail finds no user", async () => {
    db.first.mockResolvedValue(null);
    const result = await repository.findByEmail("notfound@example.com");
    expect(result).toBeNull();
  });

  it("should return null when findById finds no user", async () => {
    db.first.mockResolvedValue(null);
    const result = await repository.findById("nonexistent");
    expect(result).toBeNull();
  });
});
