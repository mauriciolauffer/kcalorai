import { Temporal } from "temporal-polyfill";
import { ProfileRepository } from "../repositories/profile.repository";
import { SetupProfileRequest, ProfileResponse, UpdateGoalRequest, UserGoal } from "../types/profile";

export class ProfileService {
  constructor(private profileRepository: ProfileRepository) {}

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

  async updateGoal(userId: string, data: UpdateGoalRequest): Promise<UserGoal> {
    const daily_calories = data.daily_calories;
    let macros: { protein_g: number; fat_g: number; carbs_g: number };

    if (
      data.protein_g !== undefined &&
      data.fat_g !== undefined &&
      data.carbs_g !== undefined
    ) {
      macros = {
        protein_g: data.protein_g,
        fat_g: data.fat_g,
        carbs_g: data.carbs_g,
      };
    } else {
      macros = this.calculateDefaultMacros(daily_calories);
    }

    const effective_from = data.effective_from ?? Temporal.Now.plainDateISO("UTC").toString();

    return this.profileRepository.createGoal({
      user_id: userId,
      daily_calories,
      ...macros,
      effective_from,
    });
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

  private calculateDefaultMacros(calories: number): {
    protein_g: number;
    fat_g: number;
    carbs_g: number;
  } {
    // Standard 30% Protein, 30% Fat, 40% Carbs
    const protein_g = Math.round((calories * 0.3) / 4);
    const fat_g = Math.round((calories * 0.3) / 9);
    const carbs_g = Math.round((calories * 0.4) / 4);

    return { protein_g, fat_g, carbs_g };
  }
}
