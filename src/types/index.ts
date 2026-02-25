import { Auth } from "../lib/auth";

export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
}

export interface AuthVariables {
  user: Auth["$Infer"]["Session"]["user"];
  session: Auth["$Infer"]["Session"]["session"];
}
