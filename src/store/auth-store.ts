import { create } from "zustand";
import { loginByPassword } from "@/api/auth";
import type { AuthState, AuthUser } from "@/types";

const AUTH_STORAGE_KEY = "react-admin-auth";

function readStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => {
  const storedUser = readStoredUser();

  return {
    user: storedUser,
    isAuthenticated: Boolean(storedUser),
    login: async (username, password, remember) => {
      const user = await loginByPassword({ username, password });

      if (!user) {
        return false;
      }

      if (remember) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }

      set({ user, isAuthenticated: true });
      return true;
    },
    logout: () => {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      set({ user: null, isAuthenticated: false });
    },
  };
});
