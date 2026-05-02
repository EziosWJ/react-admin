# 任务 15：用户管理页面拆分

## 目标

将 `src/pages/users.tsx` 拆分为按模块组织的目录结构，降低单文件复杂度，同时保持现有页面行为不变。

## 前置依赖

- 任务 14：页面拆分公共基础提取

如果任务 14 尚未合并，本任务可以先保留页面内局部组件，不阻塞目录拆分。

## 负责范围

主要负责：

- `src/pages/users.tsx`
- `src/pages/system/users/index.tsx`
- `src/pages/system/users/columns.tsx`
- `src/pages/system/users/schema.ts`
- `src/pages/system/users/user-form-dialog.tsx`
- `src/pages/system/users/role-assign-dialog.tsx`
- `src/pages/system/users/password-result-dialog.tsx`

可按需修改：

- `src/pages/system/users/utils.ts`

避免修改：

- `src/router.tsx`
- `src/api/user.ts`
- `src/types/user.ts`
- 其他业务页面

## 拆分方式

1. 新建 `src/pages/system/users/`。
2. 将原 `UsersPage` 主页面迁移到 `index.tsx`。
3. 保留 `src/pages/users.tsx`，改为兼容导出：

```ts
export { UsersPage } from "@/pages/system/users";
```

这样无需修改 `router.tsx`，也避免和其他页面拆分任务冲突。

## 建议文件职责

- `index.tsx`
  - 页面状态
  - 请求调度
  - 筛选区、工具栏、表格、分页布局
  - 弹窗打开/关闭状态

- `columns.tsx`
  - `DataTableColumn<UserRecord>[]`
  - 操作列事件通过参数传入
  - 日期格式化使用 `src/lib/datetime.ts`

- `schema.ts`
  - `userFormSchema`
  - `UserFormValues`
  - `toFormValues`
  - `buildUserPayload`
  - `buildQuery`

- `user-form-dialog.tsx`
  - 用户新增/编辑表单弹窗
  - 可复用任务 14 的 `FormDialog`

- `role-assign-dialog.tsx`
  - 角色分配弹窗

- `password-result-dialog.tsx`
  - 重置密码结果弹窗

## 实现要求

- 拆分后页面行为保持一致
- 不改变接口请求路径和请求参数
- 不改变现有路由
- 不引入新的全局状态
- 不引入新依赖
- 删除迁移后留在 `users.tsx` 的重复实现

## 验收标准

- `/users` 和 `/system/user` 均可正常访问用户管理
- 用户列表、新增、编辑、删除、启停、角色分配、重置密码行为不变
- `src/pages/users.tsx` 只保留兼容导出
- 执行 `npm run build` 通过
- 执行 `npm run lint` 无新增 error

## 注意事项

- 本任务不要顺手重构部门选择方式。
- 本任务不要修改角色管理页面。
- 如发现公共组件不足，只在本模块内保留局部实现，并在最终说明中记录。
