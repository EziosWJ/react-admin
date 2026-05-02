import { ChevronRight, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { routeTitleMap } from "@/config/navigation";

export function Breadcrumbs() {
  const location = useLocation();
  const title = routeTitleMap[location.pathname] ?? "页面";

  return (
    <nav aria-label="面包屑" className="flex items-center text-sm">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1 text-text-tertiary hover:text-primary"
      >
        <Home className="h-4 w-4" aria-hidden />
        首页
      </Link>
      <ChevronRight className="mx-2 h-4 w-4 text-text-tertiary" aria-hidden />
      <span className="font-medium text-text-primary">{title}</span>
    </nav>
  );
}

