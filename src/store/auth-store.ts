import { create } from "zustand";
import {
  getCurrentUser,
  loginByPassword,
  logoutCurrentUser,
} from "@/api/auth";
import { setAuthTokenGetter, setUnauthorizedHandler } from "@/lib/http";
import type { AuthState, CurrentUser } from "@/types";

const AUTH_STORAGE_KEY = "react-admin-auth";

type StoredAuth = {
  token: string;
  user: CurrentUser | null;
};

function isStoredAuth(value: unknown): value is StoredAuth {
  if (typeof value !== "object" || value === null) return false;

  const auth = value as Partial<StoredAuth>;
  return typeof auth.token === "string";
}

function readStoredAuth(): StoredAuth {
  const fallback: StoredAuth = { token: "", user: null };
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isStoredAuth(parsed)) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return fallback;
    }

    return {
      token: parsed.token,
      user: parsed.user ?? null,
    };
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return fallback;
  }
}

function writeStoredAuth(token: string, user: CurrentUser | null) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ token, user }));
}

function clearStoredAuth() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

function redirectToLogin() {
  if (window.location.pathname === "/login") return;

  const next = `${window.location.pathname}${window.location.search}`;
  window.location.replace(`/login?redirect=${encodeURIComponent(next)}`);
}

const storedAuth = readStoredAuth();

export const useAuthStore = create<AuthState>((set, get) => ({
  token: storedAuth.token || null,
  user: storedAuth.user,
  isAuthenticated: Boolean(storedAuth.token),
  isLoadingUser: false,

  login: async (username, password) => {
    const loginResult = await loginByPassword({ username, password });
    const token = loginResult.tokenValue;

    set({ token, user: null, isAuthenticated: true, isLoadingUser: true });
    writeStoredAuth(token, null);

    try {
      const user = await getCurrentUser();
      writeStoredAuth(token, user);
      set({ user, isAuthenticated: true, isLoadingUser: false });
      return user;
    } catch (error) {
      get().clearAuth();
      throw error;
    }
  },

  fetchCurrentUser: async () => {
    const { token, user, isLoadingUser } = get();
    if (!token) return null;
    if (user) return user;
    if (isLoadingUser) return null;

    set({ isLoadingUser: true });

    try {
      const nextUser = await getCurrentUser();
      writeStoredAuth(token, nextUser);
      set({
        user: nextUser,
        isAuthenticated: true,
        isLoadingUser: false,
      });
      return nextUser;
    } catch (error) {
      get().clearAuth();
      throw error;
    }
  },

  logout: async () => {
    try {
      if (get().token) {
        await logoutCurrentUser();
      }
    } catch {
      // 退出登录以本地清理为准，接口失败不阻塞用户离开当前会话。
    } finally {
      get().clearAuth();
    }
  },

  clearAuth: () => {
    clearStoredAuth();
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoadingUser: false,
    });
  },
}));

setAuthTokenGetter(() => useAuthStore.getState().token);
setUnauthorizedHandler(() => {
  useAuthStore.getState().clearAuth();
  redirectToLogin();
});
