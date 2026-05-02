import {
  FileText,
  LayoutDashboard,
  ListTree,
  Settings,
  SlidersHorizontal,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  path: string;
  icon: LucideIcon;
  children?: NavItem[];
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
    children: [
      {
        label: "字典管理",
        path: "/system/dicts",
        icon: ListTree,
      },
      {
        label: "配置管理",
        path: "/system/configs",
        icon: SlidersHorizontal,
      },
    ],
  },
];

export const routeTitleMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/users": "用户管理",
  "/forms/basic": "表单示例",
  "/settings": "系统设置",
  "/system/dicts": "字典管理",
  "/system/configs": "配置管理",
  "/account/profile": "个人中心",
  "/account/change-password": "修改密码",
};
