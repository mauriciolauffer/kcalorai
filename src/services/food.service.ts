import { FoodRepository } from "../repositories/food.repository";
import { LogMealRequest, UpdateFoodLogRequest, FoodLog, Food } from "../types/food";
import { NotFoundError } from "../types/errors";

export class FoodService {
  constructor(private foodRepository: FoodRepository) {}

  async logMeal(userId: string, data: LogMealRequest): Promise<FoodLog> {
    return this.foodRepository.createLog({
      user_id: userId,
      food_id: data.food_id ?? null,
      name: data.name ?? "Quick Add",
      date: data.date,
      meal: data.meal,
      servings: data.servings ?? null,
      calories: data.calories,
      protein_g: data.protein_g ?? 0,
      fat_g: data.fat_g ?? 0,
      carbs_g: data.carbs_g ?? 0,
    });
  }

  async updateLog(userId: string, logId: string, data: UpdateFoodLogRequest): Promise<FoodLog> {
    try {
      return await this.foodRepository.updateLog(logId, userId, data);
    } catch (error) {
      throw new NotFoundError("Food log not found");
    }
  }

  async deleteLog(userId: string, logId: string): Promise<void> {
    const success = await this.foodRepository.deleteLog(logId, userId);
    if (!success) {
      throw new NotFoundError("Food log not found");
    }
  }

  async getDailyLogs(userId: string, date: string): Promise<FoodLog[]> {
    return this.foodRepository.getLogsByDate(userId, date);
  }

  async searchFoods(query: string, userId: string): Promise<Food[]> {
    return this.foodRepository.searchFoods(query, userId);
  }

  async getFoodById(id: string, userId: string): Promise<Food> {
    const food = await this.foodRepository.getFoodById(id, userId);
    if (!food) {
      throw new NotFoundError("Food item not found");
    }
    return food;
  }
}
