import { Hono } from "hono";
import { Env } from "../types";
import auth from "../routes/auth";

const app = new Hono<{ Bindings: Env }>();

app.route("/auth", auth);

app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

app.get("/", (c) => {
  return c.text("kcalorai API Gateway");
});

export { app };
