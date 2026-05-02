# 任务 03：用户管理模块

## 目标

将用户管理从 mock 列表迁移到真实后端接口，并补齐基础 CRUD、启停、角色分配、重置密码等后台常见操作。

## 参考文档

- `docs/frontend-api-guide.md` 的“用户管理”
- `docs/BACKEND_INTEGRATION_CHECKLIST.md`
- `task/00-api-infrastructure.md`
- `task/01-common-components.md`

## 前置依赖

- 任务 00：API 基础设施
- 任务 01：公共基础组件中的 `Pagination`、`ConfirmDialog`、`Toast`
- 部门选择依赖任务 07，可先用普通下拉占位，后续接树选择

## 负责范围

主要负责：

- `src/api/user.ts`
- `src/types/user.ts`
- `src/types/index.ts`
- `src/pages/users.tsx`

可按需读取但谨慎修改：

- `src/api/dept.ts`
- `src/api/rbac.ts`
- `src/components/common/tree-select.tsx`

避免修改：

- 认证 store
- 角色管理页面
- 菜单管理页面
- 字典管理页面

## 后端接口

- `GET /api/system/user/page`
- `GET /api/system/user/{id}`
- `POST /api/system/user`
- `PUT /api/system/user/{id}`
- `DELETE /api/system/user/{id}`
- `DELETE /api/system/user/batch`
- `PATCH /api/system/user/{id}/status`
- `PUT /api/system/user/{id}/roles`
- `PUT /api/system/user/{id}/reset-password`

## 实现要求

1. 类型对齐后端字段：
   - `username`
   - `nickname`
   - `phone`
   - `email`
   - `avatar`
   - `gender`
   - `status: 1 | 0`
   - `deptId`
   - `deptName`
   - `roles`
   - `lastLoginTime`
   - `createTime`
2. 列表查询字段：
   - `page`
   - `pageSize`
   - `username`
   - `nickname`
   - `phone`
   - `email`
   - `status`
   - `deptId`
3. 页面能力：
   - 真实分页
   - 加载态
   - 错误态
   - 空态
   - 重置筛选
   - 刷新
4. 操作能力：
   - 新增用户
   - 编辑用户
   - 删除用户
   - 批量删除可后置，如组件未准备好
   - 启用 / 禁用
   - 分配角色
   - 重置密码并展示返回的新密码
5. 表单校验：
   - 继续使用 `react-hook-form` 和 `zod`
   - 后端字段错误映射到表单字段

## 暂不实现

- 用户导入导出
- 复杂用户权限模型
- 动态列配置

## 验收标准

- 用户列表不再读取 `src/mocks/users.ts`
- 分页总数来自后端 `total`
- 状态展示使用 `1=启用`、`0=禁用`
- 基础操作有成功和失败反馈
- 执行 `npm run build` 通过

## 注意事项

- 当前前端路由是 `/users`，后端菜单示例是 `/system/user`。本任务默认不调整路由，除非统一路由任务已先完成。
