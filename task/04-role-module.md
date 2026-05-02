# 任务 04：角色管理模块

## 目标

将角色管理迁移到真实后端接口，并按后端菜单权限模型改造角色分配菜单能力。

## 参考文档

- `docs/frontend-api-guide.md` 的“角色管理”
- `docs/frontend-api-guide.md` 的“菜单管理”
- `docs/BACKEND_INTEGRATION_CHECKLIST.md`

## 前置依赖

- 任务 00：API 基础设施
- 任务 01：公共基础组件中的 `Pagination`、`ConfirmDialog`、`Toast`、`TreeCheckList`

## 负责范围

主要负责：

- `src/api/rbac.ts` 中角色相关方法
- `src/types/rbac.ts` 中角色相关类型
- `src/pages/system-roles.tsx`

可按需读取但谨慎修改：

- `src/api/system.ts`
- `src/components/common/tree-check-list.tsx`

避免修改：

- 用户管理页面
- 菜单管理页面，除非只复用菜单树 API 类型
- 认证模块

## 后端接口

- `GET /api/system/role/page`
- `GET /api/system/role/{id}`
- `POST /api/system/role`
- `PUT /api/system/role/{id}`
- `DELETE /api/system/role/{id}`
- `DELETE /api/system/role/batch`
- `PATCH /api/system/role/{id}/status`
- `PUT /api/system/role/{id}/menus`
- `GET /api/system/menu/tree`

## 实现要求

1. 角色类型对齐后端字段：
   - `roleName`
   - `roleCode`
   - `status: 1 | 0`
   - `sortOrder`
   - `isBuiltin`
   - `remark`
   - `createTime`
   - `menuIds`
2. 列表查询字段：
   - `page`
   - `pageSize`
   - `roleName`
   - `roleCode`
   - `status`
3. 页面能力：
   - 真实分页
   - 新增角色
   - 编辑角色
   - 删除角色
   - 批量删除可后置
   - 启用 / 禁用
   - 分配菜单
4. 分配菜单：
   - 查询角色详情获取 `menuIds`
   - 查询菜单树
   - 保存时调用 `PUT /api/system/role/{id}/menus`
   - 请求体为 `{ menuIds: number[] }`
5. 内置角色保护：
   - `isBuiltin=1` 禁止删除
   - `isBuiltin=1` 禁止修改 `roleCode`

## 需要移除或后置的旧逻辑

- 当前页面包含 `permissionIds` 和权限点分配，但后端角色分配接口只接收 `menuIds`。
- 当前 `Permission` 模块与后端菜单权限模型不一致，角色分配中应先移除或隐藏权限点选择。

## 验收标准

- 角色列表不再读取 mock
- 角色分配菜单使用后端菜单树
- 保存角色菜单只提交 `menuIds`
- 内置角色操作限制生效
- 执行 `npm run build` 通过
