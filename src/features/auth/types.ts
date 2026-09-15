/**
 * Go backend model.User
 */
export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  role: "customer" | "shop" | "admin" | string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Go backend dto.TokenResponse (Returned on /auth/login)
 */
export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

/**
 * Go backend dto.RegisterResponse (Returned on /auth/register)
 */
export interface RegisterResponse {
  user: User;
  access_token?: string;
}

export interface RefreshResponseData {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
}
