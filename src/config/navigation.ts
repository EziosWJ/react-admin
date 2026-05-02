import {
  FileText,
  LayoutDashboard,
  Settings,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  path: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "用户管理",
    path: "/users",
    icon: UsersRound,
  },
  {
    label: "表单示例",
    path: "/forms/basic",
    icon: FileText,
  },
  {
    label: "系统设置",
    path: "/settings",
    icon: Settings,
  },
];

export const routeTitleMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/users": "用户管理",
  "/forms/basic": "表单示例",
  "/settings": "系统设置",
};

