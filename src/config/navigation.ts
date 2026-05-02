import {
  FileText,
  LayoutDashboard,
  ListTree,
  GitBranch,
  Settings,
  SlidersHorizontal,
  ShieldHalf,
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
      {
        label: "用户管理",
        path: "/users",
        icon: UsersRound,
      },
      {
        label: "角色管理",
        path: "/system/roles",
        icon: ShieldHalf,
      },
      {
        label: "菜单管理",
        path: "/system/menus",
        icon: GitBranch,
      },
      {
        label: "权限点管理",
        path: "/system/permissions",
        icon: ShieldHalf,
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
  "/system/roles": "角色管理",
  "/system/menus": "菜单管理",
  "/system/permissions": "权限点管理",
  "/account/profile": "个人中心",
  "/account/change-password": "修改密码",
};
