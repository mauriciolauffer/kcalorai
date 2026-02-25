export interface User {
  id: string;
  name: string;
  email: string;
  email_verified: number;
  image?: string | null;
  password_hash?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateUserDTO {
  id: string;
  name: string;
  email: string;
  password_hash?: string | null;
}
