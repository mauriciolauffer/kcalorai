import { betterAuth } from "better-auth";
import { Env } from "../types";

export const getAuth = (env: Env, executionCtx?: ExecutionContext) => {
  return betterAuth({
    appName: "kcalorai",
    database: env.DB,
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    basePath: "/auth",
    trustedOrigins: [env.BETTER_AUTH_URL],
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false, // Set to true when email service is ready
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => {
        // TODO: Implement email sending
        console.log(`Reset password email for ${user.email}: ${url}`);
      },
    },
    emailVerification: {
      sendVerificationEmail: async ({ user, url }) => {
        // TODO: Implement email sending
        console.log(`Verify email for ${user.email}: ${url}`);
      },
    },
    advanced: {
      backgroundTasks: {
        handler: (promise) => {
          if (executionCtx) {
            executionCtx.waitUntil(promise);
          }
        },
      },
    },
    user: {
      modelName: "users",
      fields: {
        emailVerified: "email_verified",
        createdAt: "created_at",
        updatedAt: "updated_at",
      },
    },
    session: {
      modelName: "sessions",
      fields: {
        userId: "user_id",
        expiresAt: "expires_at",
        ipAddress: "ip_address",
        userAgent: "user_agent",
        createdAt: "created_at",
        updatedAt: "updated_at",
      },
    },
    account: {
      modelName: "accounts",
      fields: {
        userId: "user_id",
        accountId: "account_id",
        providerId: "provider_id",
        accessToken: "access_token",
        refreshToken: "refresh_token",
        accessTokenExpiresAt: "access_token_expires_at",
        refreshTokenExpiresAt: "refresh_token_expires_at",
        idToken: "id_token",
        createdAt: "created_at",
        updatedAt: "updated_at",
      },
    },
    verification: {
      modelName: "verifications",
      fields: {
        expiresAt: "expires_at",
        createdAt: "created_at",
        updatedAt: "updated_at",
      },
    },
  });
};

export type Auth = ReturnType<typeof getAuth>;
