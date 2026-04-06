import { FoodLog, Food } from "../types/food";

export class FoodRepository {
  constructor(private db: D1Database) {}

  async createLog(log: Omit<FoodLog, "id" | "created_at" | "updated_at">): Promise<FoodLog> {
    const id = crypto.randomUUID();
    const result = await this.db
      .prepare(
        `INSERT INTO food_logs (id, user_id, food_id, name, date, meal, servings, calories, protein_g, fat_g, carbs_g)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         RETURNING *`,
      )
      .bind(
        id,
        log.user_id,
        log.food_id ?? null,
        log.name,
        log.date,
        log.meal,
        log.servings ?? null,
        log.calories,
        log.protein_g,
        log.fat_g,
        log.carbs_g,
      )
      .first<FoodLog>();

    if (!result) {
      throw new Error("Failed to create food log");
    }
    return result;
  }

  async updateLog(id: string, userId: string, log: Partial<FoodLog>): Promise<FoodLog> {
    const result = await this.db
      .prepare(
        `UPDATE food_logs SET
           meal = COALESCE(?, meal),
           name = COALESCE(?, name),
           calories = COALESCE(?, calories),
           protein_g = COALESCE(?, protein_g),
           fat_g = COALESCE(?, fat_g),
           carbs_g = COALESCE(?, carbs_g),
           servings = COALESCE(?, servings),
           updated_at = datetime('now')
         WHERE id = ? AND user_id = ?
         RETURNING *`,
      )
      .bind(
        log.meal ?? null,
        log.name ?? null,
        log.calories ?? null,
        log.protein_g ?? null,
        log.fat_g ?? null,
        log.carbs_g ?? null,
        log.servings ?? null,
        id,
        userId,
      )
      .first<FoodLog>();

    if (!result) {
      throw new Error("Failed to update food log or not found");
    }
    return result;
  }

  async deleteLog(id: string, userId: string): Promise<boolean> {
    const result = await this.db
      .prepare("DELETE FROM food_logs WHERE id = ? AND user_id = ?")
      .bind(id, userId)
      .run();
    return result.meta.changes > 0;
  }

  async getLog(id: string, userId: string): Promise<FoodLog | null> {
    return this.db
      .prepare("SELECT * FROM food_logs WHERE id = ? AND user_id = ?")
      .bind(id, userId)
      .first<FoodLog>();
  }

  async getLogsByDate(userId: string, date: string): Promise<FoodLog[]> {
    const result = await this.db
      .prepare("SELECT * FROM food_logs WHERE user_id = ? AND date = ? ORDER BY created_at ASC")
      .bind(userId, date)
      .all<FoodLog>();
    return result.results;
  }

  async searchFoods(query: string, userId: string): Promise<Food[]> {
    const result = await this.db
      .prepare(
        "SELECT * FROM foods WHERE name LIKE ? AND (user_id IS NULL OR user_id = ?) ORDER BY name ASC",
      )
      .bind(`%${query}%`, userId)
      .all<Food>();
    return result.results;
  }

  async getFoodById(id: string, userId: string): Promise<Food | null> {
    return this.db
      .prepare("SELECT * FROM foods WHERE id = ? AND (user_id IS NULL OR user_id = ?)")
      .bind(id, userId)
      .first<Food>();
  }
}
