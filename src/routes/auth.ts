import { Hono } from "hono";
import typia from "typia";
import { typiaValidator } from "@hono/typia-validator";
import { SignupRequest } from "../types/auth";
import { AuthService } from "../services/auth.service";
import { UserRepository } from "../repositories/user.repository";
import { Env } from "../types";
import { ValidationError } from "../types/errors";

const validateSignup = typia.createValidate<SignupRequest>();

const auth = new Hono<{ Bindings: Env }>().post(
  "/signup",
  typiaValidator("json", validateSignup, (result) => {
    if (!result.success) {
      throw new ValidationError("Validation failed", result.errors);
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
