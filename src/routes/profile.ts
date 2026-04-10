import { Hono } from "hono";
import typia from "typia";
import { typiaValidator } from "@hono/typia-validator";
import { Env, AuthVariables } from "../types";
import { SetupProfileRequest, UpdateGoalRequest } from "../types/profile";
import { ProfileRepository } from "../repositories/profile.repository";
import { ProfileService } from "../services/profile.service";
import { authMiddleware, getUserId } from "../middlewares/auth";
import { ValidationError } from "../types/errors";

const validateSetup = typia.createValidate<SetupProfileRequest>();
const validateUpdateGoal = typia.createValidate<UpdateGoalRequest>();

const profile = new Hono<{ Bindings: Env; Variables: AuthVariables }>()
  .use("*", authMiddleware)
  .get("/", async (c) => {
    const userId = getUserId(c);
    const profileRepository = new ProfileRepository(c.env.DB);
    const profileService = new ProfileService(profileRepository);

    const response = await profileService.getProfile(userId);
    return c.json(response);
  })
  .post(
    "/setup",
    typiaValidator("json", validateSetup, (result) => {
      if (!result.success) {
        throw new ValidationError("Validation failed", result.errors);
      }
    }),
    async (c) => {
      const userId = getUserId(c);
      const data = c.req.valid("json");
      const profileRepository = new ProfileRepository(c.env.DB);
      const profileService = new ProfileService(profileRepository);

      const response = await profileService.setupProfile(userId, data);
      return c.json(response);
    },
  )
  .post(
    "/goal",
    typiaValidator("json", validateUpdateGoal, (result) => {
      if (!result.success) {
        throw new ValidationError("Validation failed", result.errors);
      }
    }),
    async (c) => {
      const userId = getUserId(c);
      const data = c.req.valid("json");
      const profileRepository = new ProfileRepository(c.env.DB);
      const profileService = new ProfileService(profileRepository);

      const response = await profileService.updateGoal(userId, data);
      return c.json(response);
    },
  );

export default profile;
export type ProfileApp = typeof profile;
