export type RoleStatus = "enabled" | "disabled";

export type RoleDataScope = "all" | "custom" | "department" | "department_and_sub";

export type RoleRecord = {
  id: number;
  name: string;
  code: string;
  status: RoleStatus;
  dataScope: RoleDataScope;
  userCount: number;
  sort: number;
  updatedAt: string;
};

export type RoleQuery = {
  keyword?: string;
  status?: RoleStatus | "all";
  dataScope?: RoleDataScope | "all";
};

export type MenuType = "directory" | "menu" | "button";

export type MenuStatus = "enabled" | "disabled";

export type MenuRecord = {
  id: number;
  parentId: number | null;
  name: string;
  type: MenuType;
  routePath: string;
  componentPath: string;
  permission: string;
  icon: string;
  sort: number;
  status: MenuStatus;
  updatedAt: string;
  children?: MenuRecord[];
};

export type MenuQuery = {
  keyword?: string;
  type?: MenuType | "all";
  status?: MenuStatus | "all";
};

export type PermissionType = "page" | "button" | "api" | "data";

export type PermissionStatus = "enabled" | "disabled";

export type PermissionRecord = {
  id: number;
  name: string;
  code: string;
  menuName: string;
  type: PermissionType;
  status: PermissionStatus;
  sort: number;
  description: string;
  updatedAt: string;
};

export type PermissionQuery = {
  keyword?: string;
  type?: PermissionType | "all";
  status?: PermissionStatus | "all";
};

export type RolePermissionDetail = {
  roleId: number;
  roleName: string;
  roleCode: string;
  status: RoleStatus;
  dataScope: RoleDataScope;
  menuIds: number[];
  permissionIds: number[];
};
