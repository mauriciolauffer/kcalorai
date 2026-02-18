import { Hono } from "hono";
import { Env } from "../types";
import auth from "../routes/auth";

const app = new Hono<{ Bindings: Env }>()
  .route("/auth", auth)
  .get("/health", (c) => {
    return c.json({ status: "ok" });
  })
  .get("/", (c) => {
    return c.text("kcalorai API Gateway");
  });

export type AppType = typeof app;
export { app };
