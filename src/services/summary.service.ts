import { FoodRepository } from "../repositories/food.repository";
import { ProfileRepository } from "../repositories/profile.repository";
import { DailySummary, MealType, MealSummary, NutritionalValues } from "../types/food";

export class SummaryService {
  constructor(
    private foodRepository: FoodRepository,
    private profileRepository: ProfileRepository,
  ) {}

  async getDailySummary(userId: string, date: string): Promise<DailySummary> {
    const logs = await this.foodRepository.getLogsByDate(userId, date);
    const goal = await this.profileRepository.getGoalByDate(userId, date);

    const mealTypes: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
    const mealSummaries: MealSummary[] = mealTypes.map((meal) => {
      const mealLogs = logs.filter((log) => log.meal === meal);
      return {
        meal,
        calories: mealLogs.reduce((acc, log) => acc + log.calories, 0),
        protein_g: mealLogs.reduce((acc, log) => acc + log.protein_g, 0),
        fat_g: mealLogs.reduce((acc, log) => acc + log.fat_g, 0),
        carbs_g: mealLogs.reduce((acc, log) => acc + log.carbs_g, 0),
      };
    });

    const consumed: NutritionalValues = {
      calories: mealSummaries.reduce((acc, meal) => acc + meal.calories, 0),
      protein_g: mealSummaries.reduce((acc, meal) => acc + meal.protein_g, 0),
      fat_g: mealSummaries.reduce((acc, meal) => acc + meal.fat_g, 0),
      carbs_g: mealSummaries.reduce((acc, meal) => acc + meal.carbs_g, 0),
    };

    let target: NutritionalValues | null = null;
    let remaining: NutritionalValues | null = null;

    if (goal) {
      target = {
        calories: goal.daily_calories,
        protein_g: goal.protein_g,
        fat_g: goal.fat_g,
        carbs_g: goal.carbs_g,
      };

      remaining = {
        calories: target.calories - consumed.calories,
        protein_g: target.protein_g - consumed.protein_g,
        fat_g: target.fat_g - consumed.fat_g,
        carbs_g: target.carbs_g - consumed.carbs_g,
      };
    }

    return {
      date,
      consumed,
      goal: target,
      remaining,
      meals: mealSummaries,
    };
  }
}
