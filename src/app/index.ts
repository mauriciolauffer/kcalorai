import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { Env } from "../types";
import auth from "../routes/auth";
import profile from "../routes/profile";
import { AppError } from "../types/errors";

const app = new Hono<{ Bindings: Env }>()
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
  .get("/health", (c) => {
    return c.json({ status: "ok" });
  })
  .get("/", (c) => {
    return c.text("kcalorai API Gateway");
  });

export type AppType = typeof app;
export { app };
