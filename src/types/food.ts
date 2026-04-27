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
  id?: string;
  /**
   * @format date
   */
  date: string;
  meal: MealType;
  name?: string;
  calories?: number;
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

export interface CopyFoodLogRequest {
  /**
   * @format date
   */
  date?: string;
}

export interface NutritionalValues {
  calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
}

export interface MealSummary extends NutritionalValues {
  meal: MealType;
}

export interface DailySummary {
  date: string;
  consumed: NutritionalValues;
  goal: NutritionalValues | null;
  remaining: NutritionalValues | null;
  meals: MealSummary[];
}

export interface SummaryQuery {
  /**
   * @format date
   */
  date?: string;
}

export interface DailyTrend extends NutritionalValues {
  date: string;
}

export interface WeeklySummary {
  days: DailyTrend[];
  average: NutritionalValues;
}

export interface WeeklySummaryQuery {
  /**
   * @format date
   */
  endDate?: string;
}

export interface SyncFoodLogsRequest {
  upserts: LogMealRequest[];
  deleted_ids: string[];
}

export interface SyncFoodLogsResponse {
  upserted: FoodLog[];
  deleted_ids: string[];
}

export interface SyncQuery {
  since?: string; // ISO timestamp
}
