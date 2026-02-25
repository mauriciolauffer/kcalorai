import { Auth } from "../lib/auth";
import { SignupRequest, AuthResponse } from "../types/auth";

export class AuthService {
  constructor(private auth: Auth) {}

  async signup(data: SignupRequest): Promise<AuthResponse> {
    const user = await this.auth.api.signUpEmail({
      body: {
        email: data.email,
        password: data.password,
        name: data.name,
      },
    });

    if (!user) {
      throw new Error("Failed to signup");
    }

    return {
      user: {
        id: user.user.id,
        email: user.user.email,
      },
      token: "", // Better Auth uses session cookies/headers
    };
  }
}
