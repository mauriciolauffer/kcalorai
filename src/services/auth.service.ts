import { Auth } from "../lib/auth";
import { SignupRequest, AuthResponse } from "../types/auth";
import { ConflictError } from "../types/errors";
import { APIError } from "better-auth/api";

export class AuthService {
  constructor(private auth: Auth) {}

  async signup(data: SignupRequest): Promise<AuthResponse> {
    try {
      const result = await this.auth.api.signUpEmail({
        body: {
          email: data.email,
          password: data.password,
          name: data.name,
        },
      });

      if (!result) {
        throw new Error("Failed to signup");
      }

      return {
        user: {
          id: result.user.id,
          email: result.user.email,
        },
        token: result.token || "",
      };
    } catch (error) {
      if (
        error instanceof APIError &&
        error.status === 422 &&
        error.message?.includes("Email already in use")
      ) {
        throw new ConflictError("Email already in use");
      }
      throw error;
    }
  }
}
