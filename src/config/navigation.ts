import {
  Building2,
  FileText,
  History,
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
  activePaths?: string[];
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
    label: "系统管理",
    path: "/system",
    icon: Settings,
    children: [
      {
        label: "部门管理",
        path: "/system/dept",
        icon: Building2,
        activePaths: ["/system/depts"],
      },
      {
        label: "字典管理",
        path: "/system/dict",
        icon: ListTree,
        activePaths: ["/system/dicts"],
      },
      {
        label: "配置管理",
        path: "/system/config",
        icon: SlidersHorizontal,
        activePaths: ["/system/configs"],
      },
      {
        label: "用户管理",
        path: "/system/user",
        icon: UsersRound,
        activePaths: ["/users"],
      },
      {
        label: "角色管理",
        path: "/system/role",
        icon: ShieldHalf,
        activePaths: ["/system/roles"],
      },
      {
        label: "菜单管理",
        path: "/system/menu",
        icon: GitBranch,
        activePaths: ["/system/menus"],
      },
      {
        label: "权限点管理",
        path: "/system/permissions",
        icon: ShieldHalf,
      },
      {
        label: "登录日志",
        path: "/system/login-log",
        icon: History,
      },
      {
        label: "操作日志",
        path: "/system/oper-log",
        icon: FileText,
      },
    ],
  },
];

export const routeTitleMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/users": "用户管理",
  "/forms/basic": "表单示例",
  "/settings": "系统设置",
  "/system": "系统管理",
  "/system/user": "用户管理",
  "/system/dept": "部门管理",
  "/system/depts": "部门管理",
  "/system/dict": "字典管理",
  "/system/dicts": "字典管理",
  "/system/config": "配置管理",
  "/system/configs": "配置管理",
  "/system/role": "角色管理",
  "/system/roles": "角色管理",
  "/system/menu": "菜单管理",
  "/system/menus": "菜单管理",
  "/system/permissions": "权限点管理",
  "/system/login-log": "登录日志",
  "/system/oper-log": "操作日志",
  "/account/profile": "个人中心",
  "/account/change-password": "修改密码",
};
