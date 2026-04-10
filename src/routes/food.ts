import { Hono } from "hono";
import { Temporal } from "temporal-polyfill";
import typia from "typia";
import { typiaValidator } from "@hono/typia-validator";
import { Env, AuthVariables } from "../types";
import {
  LogMealRequest,
  UpdateFoodLogRequest,
  SearchFoodRequest,
  SummaryQuery,
  WeeklySummaryQuery,
} from "../types/food";
import { FoodRepository } from "../repositories/food.repository";
import { FoodService } from "../services/food.service";
import { SummaryService } from "../services/summary.service";
import { ProfileRepository } from "../repositories/profile.repository";
import { authMiddleware, getUserId } from "../middlewares/auth";
import { ValidationError } from "../types/errors";

const validateLogMeal = typia.createValidate<LogMealRequest>();
const validateUpdateLog = typia.createValidate<UpdateFoodLogRequest>();
const validateSearchFood = typia.createValidate<SearchFoodRequest>();
const validateSummaryQuery = typia.createValidate<SummaryQuery>();
const validateWeeklySummaryQuery = typia.createValidate<WeeklySummaryQuery>();

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
  .get(
    "/summary",
    typiaValidator("query", validateSummaryQuery, (result) => {
      if (!result.success) {
        throw new ValidationError("Validation failed", result.errors);
      }
    }),
    async (c) => {
      const userId = getUserId(c);
      const date = c.req.valid("query").date || Temporal.Now.plainDateISO("UTC").toString();
      const foodRepository = new FoodRepository(c.env.DB);
      const profileRepository = new ProfileRepository(c.env.DB);
      const summaryService = new SummaryService(foodRepository, profileRepository);

      const summary = await summaryService.getDailySummary(userId, date);
      return c.json(summary);
    },
  )
  .get(
    "/weekly-summary",
    typiaValidator("query", validateWeeklySummaryQuery, (result) => {
      if (!result.success) {
        throw new ValidationError("Validation failed", result.errors);
      }
    }),
    async (c) => {
      const userId = getUserId(c);
      const endDate = c.req.valid("query").endDate || Temporal.Now.plainDateISO("UTC").toString();
      const foodRepository = new FoodRepository(c.env.DB);
      const profileRepository = new ProfileRepository(c.env.DB);
      const summaryService = new SummaryService(foodRepository, profileRepository);

      const summary = await summaryService.getWeeklySummary(userId, endDate);
      return c.json(summary);
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
    const date = c.req.query("date") || Temporal.Now.plainDateISO("UTC").toString();
    const repository = new FoodRepository(c.env.DB);
    const service = new FoodService(repository);

    const logs = await service.getDailyLogs(userId, date);
    return c.json({ logs });
  })
  .get(
    "/search",
    typiaValidator("query", validateSearchFood, (result) => {
      if (!result.success) {
        throw new ValidationError("Validation failed", result.errors);
      }
    }),
    async (c) => {
      const userId = getUserId(c);
      const query = c.req.valid("query").q || "";
      const repository = new FoodRepository(c.env.DB);
      const service = new FoodService(repository);

      const results = await service.searchFoods(query, userId);
      return c.json({ results });
    },
  )
  .get("/items/:id", async (c) => {
    const userId = getUserId(c);
    const id = c.req.param("id");
    const repository = new FoodRepository(c.env.DB);
    const service = new FoodService(repository);

    const item = await service.getFoodById(id, userId);
    return c.json(item);
  });

export default food;
export type FoodApp = typeof food;
