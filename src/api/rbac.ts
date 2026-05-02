import {
  filterMockMenus,
  filterMockPermissions,
  filterMockRoles,
  getMockRolePermissionDetail,
  getMockMenuTotal,
  getMockPermissionTotal,
  mockMenus,
  mockRoles,
} from "@/mocks/rbac";
import type {
  MenuQuery,
  MenuRecord,
  PermissionQuery,
  PermissionRecord,
  RolePermissionDetail,
  RoleQuery,
  RoleRecord,
} from "@/types";

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function getRoles(query: RoleQuery = {}): Promise<RoleRecord[]> {
  await wait(300);
  return filterMockRoles(query);
}

export function getRoleTotal() {
  return mockRoles.length;
}

export async function getMenus(query: MenuQuery = {}): Promise<MenuRecord[]> {
  await wait(300);
  return filterMockMenus(query);
}

export function getMenuTotal() {
  return getMockMenuTotal();
}

export async function getMenuTree(): Promise<typeof mockMenus> {
  await wait(300);
  return mockMenus;
}

export async function getPermissions(
  query: PermissionQuery = {},
): Promise<PermissionRecord[]> {
  await wait(300);
  return filterMockPermissions(query);
}

export function getPermissionTotal() {
  return getMockPermissionTotal();
}

export async function getRolePermissionDetail(
  roleId: number,
): Promise<RolePermissionDetail | null> {
  await wait(300);
  return getMockRolePermissionDetail(roleId);
}
