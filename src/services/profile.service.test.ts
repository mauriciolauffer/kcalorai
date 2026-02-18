import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProfileService } from "./profile.service";

describe("ProfileService", () => {
  let profileRepository: any;
  let profileService: ProfileService;

  beforeEach(() => {
    profileRepository = {
      getProfile: vi.fn(),
      upsertProfile: vi.fn(),
      createGoal: vi.fn(),
      getLatestGoal: vi.fn(),
    };
    profileService = new ProfileService(profileRepository);
  });

  describe("setupProfile", () => {
    it("should calculate correct calories and macros for a male", async () => {
      const data = {
        age: 30,
        height_cm: 180,
        weight_kg: 80,
        gender: "male" as const,
        activity_level: "moderately_active" as const,
        goal: "maintain_weight" as const,
      };

      // BMR = 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
      // TDEE = 1780 * 1.55 = 2759

      profileRepository.upsertProfile.mockResolvedValue({
        ...data,
        user_id: "user1",
        profile_completed: true,
      });
      profileRepository.createGoal.mockImplementation((goal: any) =>
        Promise.resolve({ ...goal, id: "goal1", created_at: "now" }),
      );

      const result = await profileService.setupProfile("user1", data);

      expect(result.latest_goal?.daily_calories).toBe(2759);
      // Macros: 30% Protein (207g), 30% Fat (92g), 40% Carbs (276g)
      // 2759 * 0.3 / 4 = 206.925 -> 207
      // 2759 * 0.3 / 9 = 91.966... -> 92
      // 2759 * 0.4 / 4 = 275.9 -> 276
      expect(result.latest_goal?.protein_g).toBe(207);
      expect(result.latest_goal?.fat_g).toBe(92);
      expect(result.latest_goal?.carbs_g).toBe(276);
    });

    it("should enforce minimum calories", async () => {
      const data = {
        age: 80,
        height_cm: 150,
        weight_kg: 40,
        gender: "female" as const,
        activity_level: "sedentary" as const,
        goal: "lose_weight" as const,
      };

      // BMR = 10*40 + 6.25*150 - 5*80 - 161 = 400 + 937.5 - 400 - 161 = 776.5
      // TDEE = 776.5 * 1.2 = 931.8
      // Goal = 931.8 - 500 = 431.8
      // Min = 1200

      profileRepository.upsertProfile.mockResolvedValue({
        ...data,
        user_id: "user1",
        profile_completed: true,
      });
      profileRepository.createGoal.mockImplementation((goal: any) =>
        Promise.resolve({ ...goal, id: "goal1", created_at: "now" }),
      );

      const result = await profileService.setupProfile("user1", data);
      expect(result.latest_goal?.daily_calories).toBe(1200);
    });
  });

  describe("getProfile", () => {
    it("should create an empty profile if none exists", async () => {
      profileRepository.getProfile.mockResolvedValue(null);
      profileRepository.upsertProfile.mockResolvedValue({
        user_id: "user1",
        profile_completed: false,
      });
      profileRepository.getLatestGoal.mockResolvedValue(null);

      const result = await profileService.getProfile("user1");

      expect(profileRepository.upsertProfile).toHaveBeenCalledWith({
        user_id: "user1",
        profile_completed: false,
      });
      expect(result.profile.profile_completed).toBe(false);
      expect(result.latest_goal).toBeNull();
    });
  });
});
