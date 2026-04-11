export type Gender = "male" | "female";

export type ActivityLevel =
  | "sedentary"
  | "lightly_active"
  | "moderately_active"
  | "very_active"
  | "extra_active";

export type Goal = "lose_weight" | "maintain_weight" | "gain_weight";

export interface UserProfile {
  user_id: string;
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  gender: Gender | null;
  activity_level: ActivityLevel | null;
  goal: Goal | null;
  timezone: string;
  profile_completed: boolean;
  updated_at: string;
}

export interface SetupProfileRequest {
  /**
   * @minimum 1
   * @maximum 120
   */
  age: number;
  /**
   * @minimum 50
   * @maximum 300
   */
  height_cm: number;
  /**
   * @minimum 20
   * @maximum 500
   */
  weight_kg: number;
  gender: Gender;
  activity_level: ActivityLevel;
  goal: Goal;
  timezone?: string;
}

export interface UserGoal {
  id: string;
  user_id: string;
  daily_calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  effective_from: string;
  created_at: string;
}

export interface ProfileResponse {
  profile: UserProfile;
  latest_goal: UserGoal | null;
}

export interface UpdateGoalRequest {
  /**
   * @minimum 500
   * @maximum 10000
   */
  daily_calories: number;
  /**
   * @minimum 0
   */
  protein_g?: number;
  /**
   * @minimum 0
   */
  fat_g?: number;
  /**
   * @minimum 0
   */
  carbs_g?: number;
  /**
   * @format date
   */
  effective_from?: string;
}
