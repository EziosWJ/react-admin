import { KeyRound, LogOut, UserRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";

export function UserMenu() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex items-center gap-2">
      <div className="group relative hidden md:block">
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-left transition-colors hover:bg-slate-50"
          aria-haspopup="menu"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-text-secondary">
            <UserRound className="h-4 w-4" aria-hidden />
          </span>
          <div className="leading-none">
            <div className="text-sm font-medium text-text-primary">
              {user?.displayName ?? "管理员"}
            </div>
            <div className="mt-1 text-xs text-text-tertiary">
              {user?.username ?? "admin"}
            </div>
          </div>
        </button>

        <div
          className="invisible absolute right-0 top-[calc(100%+8px)] z-40 w-44 rounded-admin border border-border bg-surface p-1 opacity-0 shadow-admin transition-all group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
          role="menu"
        >
          <Link
            to="/account/profile"
            className="flex h-9 items-center gap-2 rounded-lg px-3 text-sm text-text-secondary hover:bg-slate-50 hover:text-text-primary"
            role="menuitem"
          >
            <UserRound className="h-4 w-4" aria-hidden />
            个人中心
          </Link>
          <Link
            to="/account/change-password"
            className="flex h-9 items-center gap-2 rounded-lg px-3 text-sm text-text-secondary hover:bg-slate-50 hover:text-text-primary"
            role="menuitem"
          >
            <KeyRound className="h-4 w-4" aria-hidden />
            修改密码
          </Link>
          <div className="my-1 border-t border-border" />
          <button
            type="button"
            className="flex h-9 w-full items-center gap-2 rounded-lg px-3 text-left text-sm text-text-secondary hover:bg-slate-50 hover:text-text-primary"
            onClick={handleLogout}
            role="menuitem"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            退出登录
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          aria-label="个人中心"
          title="个人中心"
          onClick={() => navigate("/account/profile")}
        >
          <UserRound className="h-4 w-4" aria-hidden />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="修改密码"
          title="修改密码"
          onClick={() => navigate("/account/change-password")}
        >
          <KeyRound className="h-4 w-4" aria-hidden />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="退出登录"
          title="退出登录"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" aria-hidden />
        </Button>
      </div>

      <div className="hidden md:block">
        <Button
          variant="ghost"
          size="icon"
          aria-label="退出登录"
          title="退出登录"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
