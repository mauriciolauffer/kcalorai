import { Hono } from "hono";
import typia from "typia";
import { typiaValidator } from "@hono/typia-validator";
import { SignupRequest } from "../types/auth";
import { AuthService } from "../services/auth.service";
import { UserRepository } from "../repositories/user.repository";
import { Env } from "../types";

const validateSignup = typia.createValidate<SignupRequest>();

const auth = new Hono<{ Bindings: Env }>().post(
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

    try {
      const response = await authService.signup(data);
      return c.json(response, 201);
    } catch (error: any) {
      if (error.message === "Email already in use") {
        return c.json({ error: error.message }, 409);
      }
      return c.json({ error: error.message || "Internal Server Error" }, 500);
    }
  },
);

export default auth;
export type AuthApp = typeof auth;
