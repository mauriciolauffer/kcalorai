import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProfileRepository } from "./profile.repository";

describe("ProfileRepository", () => {
  let db: any;
  let repository: ProfileRepository;

  beforeEach(() => {
    db = {
      prepare: vi.fn().mockReturnThis(),
      bind: vi.fn().mockReturnThis(),
      first: vi.fn(),
      all: vi.fn(),
    };
    repository = new ProfileRepository(db);
  });

  it("should return null when no profile exists", async () => {
    db.first.mockResolvedValue(null);
    const result = await repository.getProfile("user1");
    expect(result).toBeNull();
  });

  it("should return a profile with profile_completed as boolean", async () => {
    db.first.mockResolvedValue({ user_id: "user1", profile_completed: 1 });
    const result = await repository.getProfile("user1");
    expect(result?.profile_completed).toBe(true);
  });

  it("should throw when upsertProfile returns null", async () => {
    db.first.mockResolvedValue(null);
    await expect(
      repository.upsertProfile({ user_id: "user1" }),
    ).rejects.toThrow("Failed to upsert profile");
  });

  it("should upsert a profile and return it", async () => {
    db.first.mockResolvedValue({ user_id: "user1", profile_completed: 0 });
    const result = await repository.upsertProfile({ user_id: "user1", profile_completed: false });
    expect(result.profile_completed).toBe(false);
    expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO user_profiles"));
  });

  it("should throw when createGoal returns null", async () => {
    db.first.mockResolvedValue(null);
    await expect(
      repository.createGoal({
        user_id: "user1",
        daily_calories: 2000,
        protein_g: 150,
        fat_g: 67,
        carbs_g: 200,
        effective_from: "2024-01-01",
      }),
    ).rejects.toThrow("Failed to create user goal");
  });

  it("should create a goal and return it", async () => {
    const goal = {
      id: "goal1",
      user_id: "user1",
      daily_calories: 2000,
      protein_g: 150,
      fat_g: 67,
      carbs_g: 200,
      effective_from: "2024-01-01",
      created_at: "now",
    };
    db.first.mockResolvedValue(goal);
    const result = await repository.createGoal({
      user_id: "user1",
      daily_calories: 2000,
      protein_g: 150,
      fat_g: 67,
      carbs_g: 200,
      effective_from: "2024-01-01",
    });
    expect(result.daily_calories).toBe(2000);
  });

  it("should return null for getLatestGoal when none exists", async () => {
    db.first.mockResolvedValue(null);
    const result = await repository.getLatestGoal("user1");
    expect(result).toBeNull();
  });

  it("should return null for getGoalByDate when none exists", async () => {
    db.first.mockResolvedValue(null);
    const result = await repository.getGoalByDate("user1", "2024-01-01");
    expect(result).toBeNull();
  });
});
