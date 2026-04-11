import { Temporal } from "temporal-polyfill";
import { ReminderRepository } from "../repositories/reminder.repository";
import { ReminderResponse, ReminderSettings } from "../types/reminder";
import { AppError } from "../types/errors";

export class ReminderService {
  constructor(private reminderRepository: ReminderRepository) {}

  async getReminderData(userId: string): Promise<ReminderResponse> {
    let settings = await this.reminderRepository.getSettings(userId);
    if (!settings) {
      settings = await this.reminderRepository.upsertSettings(userId, false);
    }
    const reminders = await this.reminderRepository.getReminders(userId);

    return {
      settings,
      reminders,
    };
  }

  async updateSettings(userId: string, enabled: boolean): Promise<ReminderSettings> {
    return this.reminderRepository.upsertSettings(userId, enabled);
  }

  async addReminder(userId: string, time: string): Promise<ReminderResponse> {
    // Check if reminder already exists for this time
    const existing = await this.reminderRepository.getReminders(userId);
    if (existing.some((r) => r.time === time)) {
      throw new AppError("Reminder already exists for this time", 400);
    }

    await this.reminderRepository.addReminder(userId, time);
    return this.getReminderData(userId);
  }

  async deleteReminder(userId: string, id: string): Promise<ReminderResponse> {
    const deleted = await this.reminderRepository.deleteReminder(id, userId);
    if (!deleted) {
      throw new AppError("Reminder not found", 404);
    }
    return this.getReminderData(userId);
  }

  async triggerReminders(now: Temporal.ZonedDateTime): Promise<void> {
    const reminders = await this.reminderRepository.getAllEnabledReminders();

    for (const reminder of reminders) {
      try {
        const userTime = now.withTimeZone(reminder.timezone);
        const currentTime = `${String(userTime.hour).padStart(2, "0")}:${String(userTime.minute).padStart(2, "0")}`;

        if (currentTime === reminder.time) {
          console.log(
            `Triggering reminder for user ${reminder.user_id} at ${reminder.time} (Local Time: ${currentTime}, Timezone: ${reminder.timezone})`,
          );
          // Mock notification trigger
        }
      } catch (e) {
        console.error(`Failed to process reminder for user ${reminder.user_id}:`, e);
      }
    }
  }
}
