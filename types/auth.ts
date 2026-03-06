export interface User {
  id: string;
  email: string;
  created_at?: string;
}

export interface Session {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  user: User;
}
