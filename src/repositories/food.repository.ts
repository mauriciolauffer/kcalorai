import { FoodLog, Food } from "../types/food";

export class FoodRepository {
  constructor(private db: D1Database) {}

  private getUpsertStatement(
    log: Omit<FoodLog, "id" | "created_at" | "updated_at"> & { id?: string },
    id: string,
  ): D1PreparedStatement {
    const now = new Date().toISOString();
    return this.db
      .prepare(
        `INSERT INTO food_logs (id, user_id, food_id, name, date, meal, servings, calories, protein_g, fat_g, carbs_g, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           food_id = excluded.food_id,
           name = excluded.name,
           date = excluded.date,
           meal = excluded.meal,
           servings = excluded.servings,
           calories = excluded.calories,
           protein_g = excluded.protein_g,
           fat_g = excluded.fat_g,
           carbs_g = excluded.carbs_g,
           updated_at = excluded.updated_at
         WHERE food_logs.user_id = excluded.user_id
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
        now,
      );
  }

  async createLog(log: Omit<FoodLog, "id" | "created_at" | "updated_at"> & { id?: string }): Promise<FoodLog> {
    const id = log.id || crypto.randomUUID();
    const result = await this.getUpsertStatement(log, id).first<FoodLog>();

    if (!result) {
      throw new Error("Failed to create food log (possibly due to user_id mismatch on existing ID)");
    }
    return result;
  }

  async upsertLogs(
    logs: (Omit<FoodLog, "id" | "created_at" | "updated_at"> & { id?: string })[],
  ): Promise<FoodLog[]> {
    if (logs.length === 0) return [];

    const statements = logs.map((log) => {
      const id = log.id || crypto.randomUUID();
      return this.getUpsertStatement(log, id);
    });

    const results = await this.db.batch<FoodLog>(statements);
    return results.map((r) => r.results![0]).filter(Boolean);
  }

  async updateLog(id: string, userId: string, log: Partial<FoodLog>): Promise<FoodLog> {
    const now = new Date().toISOString();
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
           updated_at = ?
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
        now,
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

  async deleteLogs(ids: string[], userId: string): Promise<string[]> {
    if (ids.length === 0) return [];

    const statements = ids.map((id) =>
      this.db.prepare("DELETE FROM food_logs WHERE id = ? AND user_id = ?").bind(id, userId),
    );

    const results = await this.db.batch(statements);
    return ids.filter((id, index) => results[index].meta.changes > 0);
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

  async getLogsByDateRange(userId: string, startDate: string, endDate: string): Promise<FoodLog[]> {
    const result = await this.db
      .prepare(
        "SELECT * FROM food_logs WHERE user_id = ? AND date >= ? AND date <= ? ORDER BY date ASC, created_at ASC",
      )
      .bind(userId, startDate, endDate)
      .all<FoodLog>();
    return result.results;
  }

  async getLogsSince(userId: string, since: string): Promise<FoodLog[]> {
    const result = await this.db
      .prepare("SELECT * FROM food_logs WHERE user_id = ? AND updated_at > ? ORDER BY updated_at ASC")
      .bind(userId, since)
      .all<FoodLog>();
    return result.results;
  }

  async searchFoods(query: string, userId: string): Promise<Food[]> {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return [];
    }

    const result = await this.db
      .prepare(
        "SELECT * FROM foods WHERE name LIKE ? AND (user_id IS NULL OR user_id = ?) ORDER BY name ASC LIMIT 50",
      )
      .bind(`%${trimmedQuery}%`, userId)
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
