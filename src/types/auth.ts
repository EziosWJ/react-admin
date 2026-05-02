export type AuthUser = {
  username: string;
  displayName: string;
};

export type LoginRequest = {
  username: string;
  password: string;
};

export type AuthState = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (username: string, password: string, remember: boolean) => Promise<boolean>;
  logout: () => void;
};

export type LoginErrors = {
  username?: string;
  password?: string;
  account?: string;
};
