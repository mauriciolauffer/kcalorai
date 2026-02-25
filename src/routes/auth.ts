import { Hono } from "hono";
import { Env } from "../types";
import { getAuth } from "../lib/auth";

const auth = new Hono<{ Bindings: Env }>();

auth.on(["POST", "GET"], "/*", (c) => {
  return getAuth(c.env).handler(c.req.raw);
});

export default auth;
export type AuthApp = typeof auth;
