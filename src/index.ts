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

    const now = Temporal.Now.zonedDateTimeISO("UTC");

    ctx.waitUntil(reminderService.triggerReminders(now));
  },
};
