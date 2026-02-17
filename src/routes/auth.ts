import { Hono } from "hono";
import typia from "typia";
import { typiaValidator } from "@hono/typia-validator";
import { SignupRequest } from "../types/auth";
import { AuthService } from "../services/auth.service";
import { UserRepository } from "../repositories/user.repository";
import { Env } from "../types";
import { AppError } from "../types/errors";

const validateSignup = typia.createValidate<SignupRequest>();

const auth = new Hono<{ Bindings: Env }>();

auth.onError((err, c) => {
  if (err instanceof AppError) {
    return c.json(
      {
        error: err.message,
        details: err.details,
      },
      err.statusCode as any,
    );
  }
  return c.json({ error: "Internal Server Error" }, 500);
});

auth.post(
  "/signup",
  typiaValidator("json", validateSignup, (result, c) => {
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
    const data = c.req.valid("json");
    const userRepository = new UserRepository(c.env.DB);
    const authService = new AuthService(userRepository, c.env.JWT_SECRET);

      const response = await authService.signup(data);
      return c.json(response, 201);
    },
);

export default auth;
export type AuthApp = typeof auth;
