import { Temporal } from "temporal-polyfill";
import { app } from "./app";
import { Env } from "./types";
import { ReminderRepository } from "./repositories/reminder.repository";
import { ReminderService } from "./services/reminder.service";

export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    const reminderRepository = new ReminderRepository(env.DB);
    const reminderService = new ReminderService(reminderRepository);

    // Current time in HH:MM format
    const now = Temporal.Now.plainTimeISO();
    const currentTime = `${String(now.hour).padStart(2, "0")}:${String(now.minute).padStart(2, "0")}`;

    ctx.waitUntil(reminderService.triggerReminders(currentTime));
  },
};
