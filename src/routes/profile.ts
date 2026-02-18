import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import typia from "typia";
import { typiaValidator } from "@hono/typia-validator";
import { Env } from "../types";
import { SetupProfileRequest } from "../types/profile";
import { ProfileRepository } from "../repositories/profile.repository";
import { ProfileService } from "../services/profile.service";
import { authMiddleware, getUserId } from "../middlewares/auth";
import { AppError } from "../types/errors";

const validateSetup = typia.createValidate<SetupProfileRequest>();

const profile = new Hono<{ Bindings: Env }>();

profile.use("*", authMiddleware);

profile.get("/", async (c) => {
  const userId = getUserId(c);
  const profileRepository = new ProfileRepository(c.env.DB);
  const profileService = new ProfileService(profileRepository);

  const response = await profileService.getProfile(userId);
  return c.json(response);
});

profile.post(
  "/setup",
  typiaValidator("json", validateSetup, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          error: "Validation failed",
          details: result.errors,
        },
        400,
      );
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
);

export default profile;
export type ProfileApp = typeof profile;
