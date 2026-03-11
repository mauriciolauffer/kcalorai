import { Hono } from "hono";
import typia from "typia";
import { typiaValidator } from "@hono/typia-validator";
import { Env, AuthVariables } from "../types";
import { LogMealRequest, UpdateFoodLogRequest } from "../types/food";
import { FoodRepository } from "../repositories/food.repository";
import { FoodService } from "../services/food.service";
import { authMiddleware, getUserId } from "../middlewares/auth";
import { ValidationError } from "../types/errors";

const validateLogMeal = typia.createValidate<LogMealRequest>();
const validateUpdateLog = typia.createValidate<UpdateFoodLogRequest>();

const food = new Hono<{ Bindings: Env; Variables: AuthVariables }>()
  .use("*", authMiddleware)
  .post(
    "/",
    typiaValidator("json", validateLogMeal, (result) => {
      if (!result.success) {
        throw new ValidationError("Validation failed", result.errors);
      }
    }),
    async (c) => {
      const userId = getUserId(c);
      const data = c.req.valid("json");
      const repository = new FoodRepository(c.env.DB);
      const service = new FoodService(repository);

      const log = await service.logMeal(userId, data);
      return c.json(log, 201);
    },
  )
  .patch(
    "/:id",
    typiaValidator("json", validateUpdateLog, (result) => {
      if (!result.success) {
        throw new ValidationError("Validation failed", result.errors);
      }
    }),
    async (c) => {
      const userId = getUserId(c);
      const logId = c.req.param("id");
      const data = c.req.valid("json");
      const repository = new FoodRepository(c.env.DB);
      const service = new FoodService(repository);

      const log = await service.updateLog(userId, logId, data);
      return c.json(log);
    },
  )
  .delete("/:id", async (c) => {
    const userId = getUserId(c);
    const logId = c.req.param("id");
    const repository = new FoodRepository(c.env.DB);
    const service = new FoodService(repository);

    await service.deleteLog(userId, logId);
    return c.json({ success: true });
  })
  .get("/", async (c) => {
    const userId = getUserId(c);
    const date = c.req.query("date") || new Date().toISOString().split("T")[0];
    const repository = new FoodRepository(c.env.DB);
    const service = new FoodService(repository);

    const logs = await service.getDailyLogs(userId, date);
    return c.json({ logs });
  });

export default food;
export type FoodApp = typeof food;
