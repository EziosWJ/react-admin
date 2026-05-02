import { Link, useLocation } from "react-router-dom";
import { Boxes } from "lucide-react";
import { navItems } from "@/config/navigation";
import { cn } from "@/lib/utils";

type AppSidebarProps = {
  collapsed: boolean;
};

export function AppSidebar({ collapsed }: AppSidebarProps) {
  const location = useLocation();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 hidden border-r border-border bg-surface transition-[width] md:block",
        collapsed ? "w-16" : "w-60",
      )}
    >
      <div className="flex h-16 items-center gap-3 border-b border-border px-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
          <Boxes className="h-5 w-5" aria-hidden />
        </span>
        {!collapsed && (
          <div className="min-w-0">
            <div className="truncate text-base font-semibold text-text-primary">
              React Admin
            </div>
            <div className="truncate text-xs text-text-tertiary">基础模板</div>
          </div>
        )}
      </div>

      <nav className="space-y-1 px-3 py-4" aria-label="主导航">
        {navItems.map((item) => {
          const Icon = item.icon;
          const hasChildren = Boolean(item.children?.length);
          const active =
            location.pathname === item.path ||
            location.pathname.startsWith(`${item.path}/`) ||
            Boolean(
              item.children?.some(
                (child) =>
                  location.pathname === child.path ||
                  location.pathname.startsWith(`${child.path}/`),
              ),
            );

          return (
            <div key={item.path}>
              <Link
                to={item.path}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                  active
                    ? "bg-blue-50 text-primary"
                    : "text-text-secondary hover:bg-slate-50 hover:text-text-primary",
                  collapsed && "justify-center px-0",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>

              {hasChildren && !collapsed && (
                <div className="mt-1 space-y-1 pl-6">
                  {item.children?.map((child) => {
                    const ChildIcon = child.icon;
                    const childActive =
                      location.pathname === child.path ||
                      location.pathname.startsWith(`${child.path}/`);

                    return (
                      <Link
                        key={child.path}
                        to={child.path}
                        className={cn(
                          "flex h-9 items-center gap-2 rounded-lg px-3 text-sm transition-colors",
                          childActive
                            ? "bg-blue-50 text-primary"
                            : "text-text-secondary hover:bg-slate-50 hover:text-text-primary",
                        )}
                      >
                        <ChildIcon className="h-4 w-4 shrink-0" aria-hidden />
                        <span className="truncate">{child.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
