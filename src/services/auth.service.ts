import { sign } from "hono/jwt";
import { UserRepository } from "../repositories/user.repository";
import { SignupRequest, AuthResponse } from "../types/auth";
import { ConflictError } from "../types/errors";

export class AuthService {
  constructor(
    private userRepository: UserRepository,
    private jwtSecret: string,
  ) {}

  async signup(data: SignupRequest): Promise<AuthResponse> {
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictError("Email already in use");
    }

    const userId = crypto.randomUUID();
    const passwordHash = await this.hashPassword(data.password);

    const user = await this.userRepository.create({
      id: userId,
      email: data.email,
      password_hash: passwordHash,
    });

    const token = await sign(
      {
        sub: user.id,
        email: user.email,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
      },
      this.jwtSecret,
    );

    return {
      user: {
        id: user.id,
        email: user.email,
      },
      token,
    };
  }

  private async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveBits", "deriveKey"],
    );
    const key = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      256,
    );

    const hashHex = Array.from(new Uint8Array(key))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const saltHex = Array.from(salt)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return `${saltHex}:${hashHex}`;
  }
}
