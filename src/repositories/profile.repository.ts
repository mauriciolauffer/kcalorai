import { UserProfile, UserGoal } from "../types/profile";

export class ProfileRepository {
  constructor(private db: D1Database) {}

  async getProfile(userId: string): Promise<UserProfile | null> {
    const row = await this.db
      .prepare("SELECT * FROM user_profiles WHERE user_id = ?")
      .bind(userId)
      .first<any>();

    if (!row) return null;

    return {
      ...row,
      profile_completed: row.profile_completed === 1,
    };
  }

  async upsertProfile(profile: Partial<UserProfile> & { user_id: string }): Promise<UserProfile> {
    const existing = await this.getProfile(profile.user_id);

    if (existing) {
      const result = await this.db
        .prepare(
          `UPDATE user_profiles
           SET age = ?, height_cm = ?, weight_kg = ?, gender = ?, activity_level = ?, goal = ?, profile_completed = ?, updated_at = datetime('now')
           WHERE user_id = ?
           RETURNING *`,
        )
        .bind(
          profile.age ?? existing.age,
          profile.height_cm ?? existing.height_cm,
          profile.weight_kg ?? existing.weight_kg,
          profile.gender ?? existing.gender,
          profile.activity_level ?? existing.activity_level,
          profile.goal ?? existing.goal,
          profile.profile_completed !== undefined
            ? profile.profile_completed
              ? 1
              : 0
            : existing.profile_completed
              ? 1
              : 0,
          profile.user_id,
        )
        .first<any>();

      if (!result) {
        throw new Error("Failed to update profile");
      }

      return { ...result, profile_completed: result.profile_completed === 1 };
    } else {
      const result = await this.db
        .prepare(
          `INSERT INTO user_profiles (user_id, age, height_cm, weight_kg, gender, activity_level, goal, profile_completed)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           RETURNING *`,
        )
        .bind(
          profile.user_id,
          profile.age ?? null,
          profile.height_cm ?? null,
          profile.weight_kg ?? null,
          profile.gender ?? null,
          profile.activity_level ?? null,
          profile.goal ?? null,
          profile.profile_completed ? 1 : 0,
        )
        .first<any>();

      if (!result) {
        throw new Error("Failed to insert profile");
      }

      return { ...result, profile_completed: result.profile_completed === 1 };
    }
  }

  async createGoal(goal: Omit<UserGoal, "id" | "created_at">): Promise<UserGoal> {
    const id = crypto.randomUUID();
    const result = await this.db
      .prepare(
        `INSERT INTO user_goals (id, user_id, daily_calories, protein_g, fat_g, carbs_g, effective_from)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         RETURNING *`,
      )
      .bind(
        id,
        goal.user_id,
        goal.daily_calories,
        goal.protein_g,
        goal.fat_g,
        goal.carbs_g,
        goal.effective_from,
      )
      .first<UserGoal>();

    if (!result) {
      throw new Error("Failed to create user goal");
    }
    return result;
  }

  async getLatestGoal(userId: string): Promise<UserGoal | null> {
    return this.db
      .prepare(
        "SELECT * FROM user_goals WHERE user_id = ? ORDER BY effective_from DESC, created_at DESC LIMIT 1",
      )
      .bind(userId)
      .first<UserGoal>();
  }
}
