export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface Food {
  id: string;
  user_id: string | null;
  name: string;
  serving_grams: number;
  calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  created_at: string;
}

export interface FoodLog {
  id: string;
  user_id: string;
  food_id: string | null;
  name: string;
  date: string; // YYYY-MM-DD
  meal: MealType;
  servings: number | null;
  calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  created_at: string;
  updated_at: string;
}

export interface LogMealRequest {
  /**
   * @format date
   */
  date: string;
  meal: MealType;
  name: string;
  calories: number;
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
   * @minimum 0
   */
  servings?: number;
  food_id?: string;
}

export interface UpdateFoodLogRequest {
  meal?: MealType;
  name?: string;
  calories?: number;
  protein_g?: number;
  fat_g?: number;
  carbs_g?: number;
  servings?: number;
}

export interface SearchFoodRequest {
  q?: string;
}
