import { LogOut, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
      <div className="hidden items-center gap-2 rounded-lg border border-border bg-surface px-2.5 py-1.5 md:flex">
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
      </div>
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
  );
}

