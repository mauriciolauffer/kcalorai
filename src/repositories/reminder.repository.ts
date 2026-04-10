import { ReminderSettings, Reminder } from "../types/reminder";

export class ReminderRepository {
  constructor(private db: D1Database) {}

  async getSettings(userId: string): Promise<ReminderSettings | null> {
    const row = await this.db
      .prepare("SELECT * FROM reminder_settings WHERE user_id = ?")
      .bind(userId)
      .first<any>();

    if (!row) return null;

    return {
      ...row,
      enabled: row.enabled === 1,
    };
  }

  async upsertSettings(userId: string, enabled: boolean): Promise<ReminderSettings> {
    const result = await this.db
      .prepare(
        `INSERT INTO reminder_settings (user_id, enabled)
         VALUES (?, ?)
         ON CONFLICT(user_id) DO UPDATE SET
           enabled = excluded.enabled,
           updated_at = datetime('now')
         RETURNING *`,
      )
      .bind(userId, enabled ? 1 : 0)
      .first<any>();

    if (!result) {
      throw new Error("Failed to upsert reminder settings");
    }

    return { ...result, enabled: result.enabled === 1 };
  }

  async getReminders(userId: string): Promise<Reminder[]> {
    const { results } = await this.db
      .prepare("SELECT * FROM reminders WHERE user_id = ? ORDER BY time ASC")
      .bind(userId)
      .all<Reminder>();
    return results || [];
  }

  async addReminder(userId: string, time: string): Promise<Reminder> {
    const id = crypto.randomUUID();
    const result = await this.db
      .prepare(
        `INSERT INTO reminders (id, user_id, time)
         VALUES (?, ?, ?)
         RETURNING *`,
      )
      .bind(id, userId, time)
      .first<Reminder>();

    if (!result) {
      throw new Error("Failed to add reminder");
    }
    return result;
  }

  async deleteReminder(id: string, userId: string): Promise<boolean> {
    const result = await this.db
      .prepare("DELETE FROM reminders WHERE id = ? AND user_id = ?")
      .bind(id, userId)
      .run();
    return result.meta.changes > 0;
  }

  async getAllEnabledReminders(): Promise<{ user_id: string; time: string; timezone: string }[]> {
    const { results } = await this.db
      .prepare(`
        SELECT r.user_id, r.time, p.timezone
        FROM reminders r
        JOIN reminder_settings rs ON r.user_id = rs.user_id
        JOIN user_profiles p ON r.user_id = p.user_id
        WHERE rs.enabled = 1
      `)
      .all<any>();

    return results || [];
  }
}
