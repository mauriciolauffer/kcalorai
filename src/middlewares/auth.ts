import { Context, Next } from "hono";
import { jwt } from "hono/jwt";
import { createFactory } from "hono/factory";
import { Env } from "../types";

const factory = createFactory<{ Bindings: Env }>();

export const authMiddleware = factory.createMiddleware(async (c, next) => {
  const middleware = jwt({
    secret: c.env.JWT_SECRET,
    alg: "HS256",
  });
  return middleware(c, next);
});

export const getUserId = (c: Context): string => {
  const payload = c.get("jwtPayload");
  if (!payload || !payload.sub) {
    throw new Error("User ID not found in JWT payload");
  }
  return payload.sub as string;
};
