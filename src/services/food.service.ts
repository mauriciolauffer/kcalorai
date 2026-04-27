import { Temporal } from "temporal-polyfill";
import { FoodRepository } from "../repositories/food.repository";
import {
  LogMealRequest,
  UpdateFoodLogRequest,
  FoodLog,
  Food,
  SyncFoodLogsRequest,
  SyncFoodLogsResponse,
} from "../types/food";
import { NotFoundError, ValidationError } from "../types/errors";

export class FoodService {
  constructor(private foodRepository: FoodRepository) {}

  private async mapRequestToEntry(userId: string, data: LogMealRequest) {
    let { calories, protein_g, fat_g, carbs_g, name } = data;
    const servings = data.servings ?? 1;

    if (data.food_id) {
      const food = await this.foodRepository.getFoodById(data.food_id, userId);
      if (food) {
        name = name ?? food.name;
        calories = calories ?? Math.round(food.calories * servings);
        protein_g = protein_g ?? Number((food.protein_g * servings).toFixed(1));
        fat_g = fat_g ?? Number((food.fat_g * servings).toFixed(1));
        carbs_g = carbs_g ?? Number((food.carbs_g * servings).toFixed(1));
      }
    }

    if (calories === undefined) {
      throw new ValidationError("Calories are required for manual entries");
    }

    return {
      id: data.id,
      user_id: userId,
      food_id: data.food_id ?? null,
      name: name?.trim() || "Quick Add",
      date: data.date,
      meal: data.meal,
      servings: data.food_id ? servings : (data.servings ?? null),
      calories,
      protein_g: protein_g ?? 0,
      fat_g: fat_g ?? 0,
      carbs_g: carbs_g ?? 0,
    };
  }

  async logMeal(userId: string, data: LogMealRequest): Promise<FoodLog> {
    return this.foodRepository.createLog(await this.mapRequestToEntry(userId, data));
  }

  async updateLog(userId: string, logId: string, data: UpdateFoodLogRequest): Promise<FoodLog> {
    const existing = await this.foodRepository.getLog(logId, userId);
    if (!existing) {
      throw new NotFoundError("Food log not found");
    }

    const updateData: Partial<FoodLog> = { ...data };

    if (existing.food_id && data.servings !== undefined && data.servings !== existing.servings) {
      const food = await this.foodRepository.getFoodById(existing.food_id, userId);
      if (food) {
        const servings = data.servings;
        updateData.calories = data.calories ?? Math.round(food.calories * servings);
        updateData.protein_g = data.protein_g ?? Number((food.protein_g * servings).toFixed(1));
        updateData.fat_g = data.fat_g ?? Number((food.fat_g * servings).toFixed(1));
        updateData.carbs_g = data.carbs_g ?? Number((food.carbs_g * servings).toFixed(1));
      }
    }

    return this.foodRepository.updateLog(logId, userId, updateData);
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

  async getLogsSince(userId: string, since: string): Promise<FoodLog[]> {
    return this.foodRepository.getLogsSince(userId, since);
  }

  async sync(userId: string, data: SyncFoodLogsRequest): Promise<SyncFoodLogsResponse> {
    const upsertedEntries = await Promise.all(
      data.upserts.map((u) => this.mapRequestToEntry(userId, u)),
    );
    const upserted = await this.foodRepository.upsertLogs(upsertedEntries);

    const deleted_ids = await this.foodRepository.deleteLogs(data.deleted_ids, userId);

    return { upserted, deleted_ids };
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

  async copyLog(userId: string, logId: string, date?: string): Promise<FoodLog> {
    const log = await this.foodRepository.getLog(logId, userId);
    if (!log) {
      throw new NotFoundError("Food log not found");
    }

    const targetDate = date || Temporal.Now.plainDateISO("UTC").toString();

    return this.foodRepository.createLog({
      user_id: userId,
      food_id: log.food_id,
      name: log.name,
      date: targetDate,
      meal: log.meal,
      servings: log.servings,
      calories: log.calories,
      protein_g: log.protein_g,
      fat_g: log.fat_g,
      carbs_g: log.carbs_g,
    });
  }
}
