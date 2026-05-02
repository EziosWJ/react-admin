# 任务 07：部门管理模块

## 目标

新增部门 API、部门类型和部门管理页面，并为用户管理提供部门选择树能力。

## 参考文档

- `docs/frontend-api-guide.md` 的“部门管理”
- `docs/BACKEND_INTEGRATION_CHECKLIST.md`

## 前置依赖

- 任务 00：API 基础设施
- 任务 01：公共基础组件中的 `Pagination`、`ConfirmDialog`、`Toast`、`TreeSelect`

## 负责范围

主要负责：

- `src/api/dept.ts`
- `src/types/dept.ts`
- `src/types/index.ts`
- `src/pages/system-depts.tsx`
- `src/router.tsx`
- `src/config/navigation.ts`

可按需配合：

- 用户管理模块后续可复用 `getDeptOptions`

避免修改：

- 用户管理页面，除非用户模块任务已明确交接
- 角色、菜单、字典页面

## 后端接口

- `GET /api/system/dept/tree`
- `GET /api/system/dept/options`
- `GET /api/system/dept/page`
- `GET /api/system/dept/{id}`
- `POST /api/system/dept`
- `PUT /api/system/dept/{id}`
- `DELETE /api/system/dept/{id}`
- `DELETE /api/system/dept/batch`
- `PATCH /api/system/dept/{id}/status`

## 实现要求

1. 定义部门类型：
   - `id`
   - `parentId`
   - `deptName`
   - `deptCode`
   - `leader`
   - `phone`
   - `email`
   - `sortOrder`
   - `status: 1 | 0`
   - `isBuiltin`
   - `remark`
   - `children`
2. API 方法：
   - 部门树
   - 部门选择树
   - 分页
   - 详情
   - 新增
   - 修改
   - 删除
   - 批量删除可后置
   - 启停
3. 页面能力：
   - PageHeader
   - SearchFilterBar
   - TableToolbar
   - DataTable
   - Pagination
   - 新增 / 编辑表单
   - 删除确认
4. 内置部门保护：
   - `isBuiltin=1` 禁止删除
   - `isBuiltin=1` 不建议修改编码
5. 路由和导航：
   - 建议路径：`/system/depts`
   - 加入系统设置菜单

## 验收标准

- 新增部门管理页面可访问
- 部门列表来自真实接口
- 部门选择树 API 可被用户管理复用
- 执行 `npm run build` 通过
