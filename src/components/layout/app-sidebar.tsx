import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Boxes, ChevronDown } from "lucide-react";
import { navItems } from "@/config/navigation";
import { cn } from "@/lib/utils";

type AppSidebarProps = {
  collapsed: boolean;
};

function isPathActive(pathname: string, path: string) {
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function AppSidebar({ collapsed }: AppSidebarProps) {
  const location = useLocation();
  const [expandedPaths, setExpandedPaths] = useState<string[]>([]);

  const activeGroupPaths = useMemo(
    () =>
      navItems
        .filter((item) => {
          if (!item.children?.length) return false;

          return item.children.some(
            (child) =>
              isPathActive(location.pathname, child.path) ||
              Boolean(
                child.activePaths?.some((path) =>
                  isPathActive(location.pathname, path),
                ),
              ),
          );
        })
        .map((item) => item.path),
    [location.pathname],
  );

  useEffect(() => {
    if (activeGroupPaths.length === 0) return;

    setExpandedPaths((current) => {
      const next = new Set(current);
      activeGroupPaths.forEach((path) => next.add(path));
      return Array.from(next);
    });
  }, [activeGroupPaths]);

  const toggleGroup = (path: string) => {
    setExpandedPaths((current) =>
      current.includes(path)
        ? current.filter((item) => item !== path)
        : [...current, path],
    );
  };

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
          const isExpanded = expandedPaths.includes(item.path);
          const active =
            isPathActive(location.pathname, item.path) ||
            Boolean(
              item.activePaths?.some((path) =>
                isPathActive(location.pathname, path),
              ),
            ) ||
            Boolean(
              item.children?.some(
                (child) =>
                  isPathActive(location.pathname, child.path) ||
                  Boolean(
                    child.activePaths?.some((path) =>
                      isPathActive(location.pathname, path),
                    ),
                  ),
              ),
            );

          return (
            <div key={item.path}>
              {hasChildren ? (
                <button
                  type="button"
                  title={collapsed ? item.label : undefined}
                  aria-expanded={!collapsed && isExpanded}
                  className={cn(
                    "flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                    active
                      ? "bg-blue-50 text-primary"
                      : "text-text-secondary hover:bg-slate-50 hover:text-text-primary",
                    collapsed && "justify-center px-0",
                  )}
                  onClick={() => toggleGroup(item.path)}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {!collapsed && (
                    <ChevronDown
                      className={cn(
                        "ml-auto h-4 w-4 shrink-0 transition-transform",
                        isExpanded && "rotate-180",
                      )}
                      aria-hidden
                    />
                  )}
                </button>
              ) : (
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
              )}

              {hasChildren && !collapsed && isExpanded && (
                <div className="mt-1 space-y-1 pl-6">
                  {item.children?.map((child) => {
                    const ChildIcon = child.icon;
                    const childActive =
                      isPathActive(location.pathname, child.path) ||
                      Boolean(
                        child.activePaths?.some((path) =>
                          isPathActive(location.pathname, path),
                        ),
                      );

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
