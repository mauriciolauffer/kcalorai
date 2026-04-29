import { Temporal } from "temporal-polyfill";
import { ProfileRepository } from "../repositories/profile.repository";
import { SetupProfileRequest, ProfileResponse, UpdateGoalRequest } from "../types/profile";
import { ValidationError } from "../types/errors";

export class ProfileService {
  private profileRepository: ProfileRepository;
  constructor(profileRepository: ProfileRepository) {
    this.profileRepository = profileRepository;
  }

  async getProfile(userId: string): Promise<ProfileResponse> {
    let profile = await this.profileRepository.getProfile(userId);
    if (!profile) {
      // Create empty profile if it doesn't exist
      profile = await this.profileRepository.upsertProfile({
        user_id: userId,
        profile_completed: false,
      });
    }

    const latestGoal = await this.profileRepository.getLatestGoal(userId);

    return {
      profile,
      latest_goal: latestGoal,
    };
  }

  async setupProfile(userId: string, data: SetupProfileRequest): Promise<ProfileResponse> {
    const dailyCalories = this.calculateDailyCalories(data);
    const macros = this.calculateDefaultMacros(dailyCalories);

    const profile = await this.profileRepository.upsertProfile({
      user_id: userId,
      ...data,
      profile_completed: true,
    });

    const goal = await this.profileRepository.createGoal({
      user_id: userId,
      daily_calories: dailyCalories,
      ...macros,
      effective_from: Temporal.Now.plainDateISO("UTC").toString(),
    });

    return {
      profile,
      latest_goal: goal,
    };
  }

  async updateGoal(userId: string, data: UpdateGoalRequest): Promise<ProfileResponse> {
    const { daily_calories, protein_g, fat_g, carbs_g } = data;

    let finalMacros: { protein_g: number; fat_g: number; carbs_g: number };

    if (protein_g !== undefined || fat_g !== undefined || carbs_g !== undefined) {
      // US14: User can manually adjust protein, fat, and carb targets
      // If any macro is provided, we use provided values and fill missing ones from the latest goal
      const latestGoal = await this.profileRepository.getLatestGoal(userId);
      finalMacros = {
        protein_g: protein_g ?? latestGoal?.protein_g ?? 0,
        fat_g: fat_g ?? latestGoal?.fat_g ?? 0,
        carbs_g: carbs_g ?? latestGoal?.carbs_g ?? 0,
      };

      // US14: Changes validate that macros align with total calories (with 5% tolerance)
      this.validateMacroConsistency(
        daily_calories,
        finalMacros.protein_g,
        finalMacros.fat_g,
        finalMacros.carbs_g,
      );
    } else {
      finalMacros = this.calculateDefaultMacros(daily_calories);
    }

    const effective_from = data.effective_from ?? Temporal.Now.plainDateISO("UTC").toString();

    await this.profileRepository.createGoal({
      user_id: userId,
      daily_calories,
      ...finalMacros,
      effective_from,
    });

    return this.getProfile(userId);
  }

  private calculateDailyCalories(data: SetupProfileRequest): number {
    const { age, height_cm, weight_kg, gender, activity_level, goal } = data;

    const bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + (gender === "male" ? 5 : -161);

    const multipliers: Record<string, number> = {
      sedentary: 1.2,
      lightly_active: 1.375,
      moderately_active: 1.55,
      very_active: 1.725,
      extra_active: 1.9,
    };

    const multiplier = multipliers[activity_level] || 1.2;
    let tdee = bmr * multiplier;

    if (goal === "lose_weight") {
      tdee -= 500;
    } else if (goal === "gain_weight") {
      tdee += 500;
    }

    return Math.max(1200, Math.round(tdee)); // Minimum 1200 kcal for safety
  }

  /**
   * Calculates default macronutrient targets based on a calorie goal.
   * Uses a standard split: 30% Protein, 30% Fat, 40% Carbs.
   *
   * Energy values used for calculation:
   * - Protein: 4 kcal/g
   * - Fat: 9 kcal/g
   * - Carbs: 4 kcal/g
   *
   * @param calories The daily calorie goal.
   * @returns An object containing default protein, fat, and carb targets in grams.
   */
  private calculateDefaultMacros(calories: number): {
    protein_g: number;
    fat_g: number;
    carbs_g: number;
  } {
    // US13: App calculates default macro targets based on calorie goal
    // Standard 30% Protein, 30% Fat, 40% Carbs
    const protein_g = Math.round((calories * 0.3) / 4);
    const fat_g = Math.round((calories * 0.3) / 9);
    const carbs_g = Math.round((calories * 0.4) / 4);

    return { protein_g, fat_g, carbs_g };
  }

  /**
   * Validates that the sum of calories from macros (4/4/9 rule) is within a 5% tolerance
   * of the daily calorie goal.
   */
  private validateMacroConsistency(
    calories: number,
    protein: number,
    fat: number,
    carbs: number,
  ): void {
    const calculatedCalories = protein * 4 + fat * 9 + carbs * 4;
    const diff = Math.abs(calculatedCalories - calories);
    const tolerance = calories * 0.05;

    if (diff > tolerance) {
      throw new ValidationError(
        `Custom macros (${calculatedCalories} kcal) do not align with daily calorie goal (${calories} kcal).`,
      );
    }
  }
}
