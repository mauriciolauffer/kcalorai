import { Context, MiddlewareHandler } from "hono";
import { Env, AuthVariables } from "../types";
import { UnauthorizedError } from "../types/errors";
import { getAuth } from "../lib/auth";

export const authMiddleware: MiddlewareHandler<{
  Bindings: Env;
  Variables: AuthVariables;
}> = async (c, next) => {
  const auth = getAuth(c.env);
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    throw new UnauthorizedError("Unauthorized");
  }

  c.set("user", session.user);
  c.set("session", session.session);
  return next();
};

export const getUserId = (c: Context): string => {
  const user = c.get("user");
  if (!user || !user.id) {
    throw new UnauthorizedError("User ID not found in session");
  }
  return user.id;
};
