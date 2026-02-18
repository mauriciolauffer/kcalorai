export interface SignupRequest {
  /**
   * @format email
   */
  email: string;

  /**
   * @minLength 8
   * @pattern ^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$
   */
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
  };
  token: string;
}
