# 任务 17：角色管理页面拆分

## 目标

将 `src/pages/system-roles.tsx` 拆分为角色管理模块目录，分离页面容器、表格列、表单和菜单分配弹窗。

## 前置依赖

- 任务 14：页面拆分公共基础提取

如果任务 14 尚未合并，本任务可以先保留当前弹窗结构。

## 负责范围

主要负责：

- `src/pages/system-roles.tsx`
- `src/pages/system/roles/index.tsx`
- `src/pages/system/roles/columns.tsx`
- `src/pages/system/roles/schema.ts`
- `src/pages/system/roles/role-form-dialog.tsx`
- `src/pages/system/roles/role-menu-dialog.tsx`

可按需新增：

- `src/pages/system/roles/utils.ts`

避免修改：

- `src/router.tsx`
- `src/api/rbac.ts`
- `src/types/rbac.ts`
- 用户、菜单、字典、部门页面

## 拆分方式

1. 新建 `src/pages/system/roles/`。
2. 将原 `SystemRolesPage` 主页面迁移到 `index.tsx`。
3. 保留 `src/pages/system-roles.tsx`，改为兼容导出：

```ts
export { SystemRolesPage } from "@/pages/system/roles";
```

## 建议文件职责

- `index.tsx`
  - 页面状态
  - 角色列表请求
  - 分配菜单请求
  - 页面布局和弹窗状态

- `columns.tsx`
  - 角色表格列
  - 操作列事件通过参数传入

- `schema.ts`
  - `roleFormSchema`
  - `RoleFormValues`
  - `toFormValues`
  - `buildRolePayload`
  - `buildQuery`
  - 菜单树到勾选节点转换函数

- `role-form-dialog.tsx`
  - 角色新增/编辑表单弹窗

- `role-menu-dialog.tsx`
  - 菜单权限分配弹窗

## 实现要求

- 拆分后行为保持一致
- 不调整角色 API
- 不改变菜单树勾选逻辑
- 不引入新权限模型
- 不引入新依赖

## 验收标准

- `/system/role` 和 `/system/roles` 均可正常访问角色管理
- 角色新增、编辑、删除、启停、菜单分配行为不变
- `src/pages/system-roles.tsx` 只保留兼容导出
- 执行 `npm run build` 通过
- 执行 `npm run lint` 无新增 error

## 注意事项

- 本任务不要修改菜单管理页面。
- 本任务不要把菜单权限逻辑抽到全局 store。
