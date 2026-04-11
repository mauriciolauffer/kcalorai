import { Hono } from "hono";
import typia from "typia";
import { typiaValidator } from "@hono/typia-validator";
import { Env, AuthVariables } from "../types";
import { UpdateReminderSettingsRequest, CreateReminderRequest } from "../types/reminder";
import { ReminderRepository } from "../repositories/reminder.repository";
import { ReminderService } from "../services/reminder.service";
import { authMiddleware, getUserId } from "../middlewares/auth";
import { ValidationError } from "../types/errors";

const validateUpdateSettings = typia.createValidate<UpdateReminderSettingsRequest>();
const validateCreateReminder = typia.createValidate<CreateReminderRequest>();

const reminder = new Hono<{ Bindings: Env; Variables: AuthVariables }>()
  .use("*", authMiddleware)
  .get("/", async (c) => {
    const userId = getUserId(c);
    const reminderRepository = new ReminderRepository(c.env.DB);
    const reminderService = new ReminderService(reminderRepository);

    const response = await reminderService.getReminderData(userId);
    return c.json(response);
  })
  .patch(
    "/settings",
    typiaValidator("json", validateUpdateSettings, (result) => {
      if (!result.success) {
        throw new ValidationError("Validation failed", result.errors);
      }
    }),
    async (c) => {
      const userId = getUserId(c);
      const { enabled } = c.req.valid("json");
      const reminderRepository = new ReminderRepository(c.env.DB);
      const reminderService = new ReminderService(reminderRepository);

      const response = await reminderService.updateSettings(userId, enabled);
      return c.json(response);
    },
  )
  .post(
    "/",
    typiaValidator("json", validateCreateReminder, (result) => {
      if (!result.success) {
        throw new ValidationError("Validation failed", result.errors);
      }
    }),
    async (c) => {
      const userId = getUserId(c);
      const { time } = c.req.valid("json");
      const reminderRepository = new ReminderRepository(c.env.DB);
      const reminderService = new ReminderService(reminderRepository);

      const response = await reminderService.addReminder(userId, time);
      return c.json(response, 201);
    },
  )
  .delete("/:id", async (c) => {
    const userId = getUserId(c);
    const id = c.req.param("id");
    const reminderRepository = new ReminderRepository(c.env.DB);
    const reminderService = new ReminderService(reminderRepository);

    const response = await reminderService.deleteReminder(userId, id);
    return c.json(response);
  });

export default reminder;
export type ReminderApp = typeof reminder;
