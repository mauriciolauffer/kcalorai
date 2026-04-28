import { User, CreateUserDTO } from "../types/user";

export class UserRepository {
  private db: D1Database;
  constructor(db: D1Database) {
    this.db = db;
  }

  async create(user: CreateUserDTO): Promise<User> {
    const result = await this.db
      .prepare("INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?) RETURNING *")
      .bind(user.id, user.name, user.email, user.password_hash ?? null)
      .first<User>();

    if (!result) {
      throw new Error("Failed to create user");
    }
    return result;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.db.prepare("SELECT * FROM users WHERE email = ?").bind(email).first<User>();
  }

  async findById(id: string): Promise<User | null> {
    return this.db.prepare("SELECT * FROM users WHERE id = ?").bind(id).first<User>();
  }
}
