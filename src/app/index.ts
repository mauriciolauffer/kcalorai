import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { Env, AuthVariables } from "../types";
import auth from "../routes/auth";
import profile from "../routes/profile";
import food from "../routes/food";
import reminder from "../routes/reminder";
import { AppError } from "../types/errors";

const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>()
  .onError((err, c) => {
    if (err instanceof AppError) {
      return c.json(
        {
          error: err.message,
          ...(err.details ? { details: err.details } : {}),
        },
        err.statusCode as any,
      );
    }
    if (err instanceof HTTPException) {
      return err.getResponse();
    }
    console.error(err);
    return c.json({ error: "Internal Server Error" }, 500);
  })
  .route("/auth", auth)
  .route("/profile", profile)
  .route("/food", food)
  .route("/reminders", reminder)
  .get("/health", (c) => {
    return c.json({ status: "ok" });
  })
  .get("/", (c) => {
    return c.text("kcalorai API Gateway");
  });

export type AppType = typeof app;
export { app };
