import { Context, Next, MiddlewareHandler } from "hono";
import { jwt } from "hono/jwt";
import { Env } from "../types";

export const authMiddleware: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  const middleware = jwt({
    secret: c.env.JWT_SECRET,
    alg: "HS256",
  });
  return middleware(c, next);
};

export const getUserId = (c: Context): string => {
  const payload = c.get("jwtPayload");
  if (!payload || !payload.sub) {
    throw new Error("User ID not found in JWT payload");
  }
  return payload.sub as string;
};
