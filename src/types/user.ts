export interface User {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserDTO {
  id: string;
  email: string;
  password_hash: string;
}
