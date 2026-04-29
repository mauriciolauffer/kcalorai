import { describe, it, expect, vi, beforeEach } from "vitest";
import { Temporal } from "temporal-polyfill";
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

      expect(result.latest_goal?.effective_from).toBe(Temporal.Now.plainDateISO("UTC").toString());
      expect(result.latest_goal?.daily_calories).toBe(2759);
      // Macros: 30% Protein (207g), 30% Fat (92g), 40% Carbs (276g)
      // 2759 * 0.3 / 4 = 206.925 -> 207
      // 2759 * 0.3 / 9 = 91.966... -> 92
      // 2759 * 0.4 / 4 = 275.9 -> 276
      expect(result.latest_goal?.protein_g).toBe(207);
      expect(result.latest_goal?.fat_g).toBe(92);
      expect(result.latest_goal?.carbs_g).toBe(276);
    });

    it("should add 500 kcal for gain_weight goal", async () => {
      const data = {
        age: 30,
        height_cm: 175,
        weight_kg: 70,
        gender: "male" as const,
        activity_level: "sedentary" as const,
        goal: "gain_weight" as const,
      };

      profileRepository.upsertProfile.mockResolvedValue({
        ...data,
        user_id: "user1",
        profile_completed: true,
      });
      profileRepository.createGoal.mockImplementation((goal: any) =>
        Promise.resolve({ ...goal, id: "goal1", created_at: "now" }),
      );

      const result = await profileService.setupProfile("user1", data);

      // BMR = 10*70 + 6.25*175 - 5*30 + 5 = 700 + 1093.75 - 150 + 5 = 1648.75
      // TDEE = 1648.75 * 1.2 = 1978.5 -> gain +500 = 2478.5 -> round = 2479
      expect(result.latest_goal?.daily_calories).toBe(2479);
    });

    it("should subtract 500 kcal for lose_weight goal", async () => {
      const data = {
        age: 30,
        height_cm: 175,
        weight_kg: 70,
        gender: "male" as const,
        activity_level: "sedentary" as const,
        goal: "lose_weight" as const,
      };
      profileRepository.upsertProfile.mockResolvedValue({
        ...data,
        user_id: "user1",
        profile_completed: true,
      });
      profileRepository.createGoal.mockImplementation((goal: any) =>
        Promise.resolve({ ...goal, id: "goal1", created_at: "now" }),
      );

      const result = await profileService.setupProfile("user1", data);

      // BMR = 10*70 + 6.25*175 - 5*30 + 5 = 700 + 1093.75 - 150 + 5 = 1648.75
      // TDEE = 1648.75 * 1.2 = 1978.5 -> lose -500 = 1478.5 -> round = 1479
      expect(result.latest_goal?.daily_calories).toBe(1479);
    });

    it.each([
      ["lightly_active", 1.375, "male"],
      ["very_active", 1.725, "male"],
      ["extra_active", 1.9, "female"],
    ] as const)(
      "should apply %s multiplier correctly",
      async (activity_level, multiplier, gender) => {
        const data = {
          age: 25,
          height_cm: 170,
          weight_kg: 65,
          gender,
          activity_level,
          goal: "maintain_weight" as const,
        };
        profileRepository.upsertProfile.mockResolvedValue({
          ...data,
          user_id: "user1",
          profile_completed: true,
        });
        profileRepository.createGoal.mockImplementation((goal: any) =>
          Promise.resolve({ ...goal, id: "goal1", created_at: "now" }),
        );

        const result = await profileService.setupProfile("user1", data);

        const genderOffset = gender === "male" ? 5 : -161;
        const bmr = 10 * 65 + 6.25 * 170 - 5 * 25 + genderOffset;
        const expected = Math.max(1200, Math.round(bmr * multiplier));
        expect(result.latest_goal?.daily_calories).toBe(expected);
      },
    );

    it("should fall back to sedentary multiplier for unknown activity_level", async () => {
      const data = {
        age: 30,
        height_cm: 175,
        weight_kg: 70,
        gender: "male" as const,
        activity_level: "unknown_level" as any,
        goal: "maintain_weight" as const,
      };
      profileRepository.upsertProfile.mockResolvedValue({
        ...data,
        user_id: "user1",
        profile_completed: true,
      });
      profileRepository.createGoal.mockImplementation((goal: any) =>
        Promise.resolve({ ...goal, id: "goal1", created_at: "now" }),
      );

      const result = await profileService.setupProfile("user1", data);

      // BMR = 10*70 + 6.25*175 - 5*30 + 5 = 1648.75, fallback multiplier = 1.2
      expect(result.latest_goal?.daily_calories).toBe(1979);
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

  describe("updateGoal", () => {
    it("should update goal with manual calories and default macros", async () => {
      const daily_calories = 2000;
      profileRepository.createGoal.mockImplementation((goal: any) =>
        Promise.resolve({ ...goal, id: "goal1", created_at: "now" }),
      );
      profileRepository.getProfile.mockResolvedValue({ user_id: "user1" });
      profileRepository.getLatestGoal.mockResolvedValue({
        id: "goal1",
        daily_calories: 2000,
        protein_g: 150,
        fat_g: 67,
        carbs_g: 200,
        effective_from: Temporal.Now.plainDateISO("UTC").toString(),
      });

      const result = await profileService.updateGoal("user1", { daily_calories });

      expect(result.latest_goal?.daily_calories).toBe(2000);
      expect(result.latest_goal?.protein_g).toBe(150);
      expect(result.latest_goal?.effective_from).toBe(Temporal.Now.plainDateISO("UTC").toString());
    });

    it("should update goal with custom macros when all are provided", async () => {
      const data = {
        daily_calories: 2500,
        protein_g: 200,
        fat_g: 80,
        carbs_g: 245,
        effective_from: "2023-01-01",
      };
      profileRepository.createGoal.mockImplementation((goal: any) =>
        Promise.resolve({ ...goal, id: "goal1", created_at: "now" }),
      );
      profileRepository.getProfile.mockResolvedValue({ user_id: "user1" });
      profileRepository.getLatestGoal.mockResolvedValue({
        id: "goal1",
        ...data,
        created_at: "now",
      });

      const result = await profileService.updateGoal("user1", data);

      expect(profileRepository.createGoal).toHaveBeenCalledWith({
        user_id: "user1",
        daily_calories: 2500,
        protein_g: 200,
        fat_g: 80,
        carbs_g: 245,
        effective_from: "2023-01-01",
      });
      expect(result.latest_goal?.protein_g).toBe(200);
    });

    it("should use latest goal to fill missing macros and validate consistency", async () => {
      const data = {
        daily_calories: 2000,
        protein_g: 150, // 600 kcal
        // fat_g (67 -> 603) and carbs_g (200 -> 800) missing, will be filled from latest goal
      };
      profileRepository.createGoal.mockImplementation((goal: any) =>
        Promise.resolve({ ...goal, id: "goal1", created_at: "now" }),
      );
      profileRepository.getProfile.mockResolvedValue({ user_id: "user1" });
      profileRepository.getLatestGoal.mockResolvedValue({
        id: "goal-old",
        daily_calories: 2000,
        protein_g: 150,
        fat_g: 67,
        carbs_g: 200,
        effective_from: "2023-01-01",
      });

      const result = await profileService.updateGoal("user1", data);

      expect(profileRepository.createGoal).toHaveBeenCalledWith({
        user_id: "user1",
        daily_calories: 2000,
        protein_g: 150,
        fat_g: 67,
        carbs_g: 200,
        effective_from: Temporal.Now.plainDateISO("UTC").toString(),
      });
      expect(result.latest_goal?.protein_g).toBe(150);
    });
    it("should throw ValidationError when custom macros don't align with calories", async () => {
      const data = {
        daily_calories: 2000,
        protein_g: 300, // 1200 kcal alone — way over 2000
        fat_g: 100,
        carbs_g: 100,
      };
      profileRepository.getLatestGoal.mockResolvedValue(null);

      await expect(profileService.updateGoal("user1", data)).rejects.toThrow(
        "do not align with daily calorie goal",
      );
    });

    it("should use 0 as fallback when no latest goal exists for missing macros", async () => {
      // protein=50g (200 kcal) + fat=50g (450 kcal) + carbs=350g (1400 kcal) = 2050, within 5% of 2000 (100 kcal tolerance)
      const data = { daily_calories: 2000, protein_g: 50, fat_g: 50 };
      profileRepository.getLatestGoal
        .mockResolvedValueOnce(null) // first call in updateGoal — fill carbs_g from latest (null -> 0)
        .mockResolvedValueOnce({
          id: "goal1",
          daily_calories: 2000,
          protein_g: 50,
          fat_g: 50,
          carbs_g: 350,
          effective_from: "2024-01-01",
        }); // second call in getProfile
      profileRepository.createGoal.mockImplementation((goal: any) =>
        Promise.resolve({ ...goal, id: "goal1", created_at: "now" }),
      );
      profileRepository.getProfile.mockResolvedValue({ user_id: "user1" });

      // Note: protein=50 (200) + fat=50 (450) + carbs=0 (0) = 650 kcal, which differs
      // from 2000 by 1350 > 5% tolerance (100), so this should throw
      await expect(profileService.updateGoal("user1", data)).rejects.toThrow(
        "do not align with daily calorie goal",
      );
    });

    it("should use provided effective_from date when specified", async () => {
      const data = { daily_calories: 2000, effective_from: "2025-01-01" };
      profileRepository.createGoal.mockImplementation((goal: any) =>
        Promise.resolve({ ...goal, id: "goal1", created_at: "now" }),
      );
      profileRepository.getProfile.mockResolvedValue({ user_id: "user1" });
      profileRepository.getLatestGoal.mockResolvedValue({
        id: "goal1",
        daily_calories: 2000,
        protein_g: 150,
        fat_g: 67,
        carbs_g: 200,
        effective_from: "2025-01-01",
      });

      await profileService.updateGoal("user1", data);

      expect(profileRepository.createGoal).toHaveBeenCalledWith(
        expect.objectContaining({ effective_from: "2025-01-01" }),
      );
    });
  });
});
