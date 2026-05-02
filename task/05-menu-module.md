# 任务 05：菜单管理模块

## 目标

将菜单管理迁移到真实后端接口，统一菜单类型、可见性、外链、权限标识和图标映射。

## 参考文档

- `docs/frontend-api-guide.md` 的“菜单管理”
- `docs/BACKEND_INTEGRATION_CHECKLIST.md`

## 前置依赖

- 任务 00：API 基础设施
- 任务 01：公共基础组件中的 `Pagination`、`ConfirmDialog`、`Toast`、`TreeSelect`

## 负责范围

主要负责：

- `src/api/rbac.ts` 中菜单相关方法，或按需要新增 `src/api/menu.ts`
- `src/types/rbac.ts` 中菜单相关类型
- `src/pages/system-menus.tsx`
- 可选：`src/lib/menu-icons.ts`

避免修改：

- 角色管理页面
- 认证动态菜单逻辑
- 用户管理页面

## 后端接口

- `GET /api/system/menu/tree`
- `GET /api/system/menu/page`
- `GET /api/system/menu/{id}`
- `POST /api/system/menu`
- `PUT /api/system/menu/{id}`
- `DELETE /api/system/menu/{id}`
- `DELETE /api/system/menu/batch`
- `PATCH /api/system/menu/{id}/status`

## 实现要求

1. 菜单类型对齐后端字段：
   - `menuName`
   - `menuType: "DIR" | "MENU" | "LINK"`
   - `path`
   - `component`
   - `icon`
   - `permissionCode`
   - `sortOrder`
   - `visible: 1 | 0`
   - `status: 1 | 0`
   - `externalUrl`
   - `isBuiltin`
   - `children`
2. 列表查询字段：
   - `page`
   - `pageSize`
   - `menuName`
   - `menuType`
   - `status`
   - `visible`
3. 页面能力：
   - 真实分页
   - 菜单树读取
   - 新增菜单
   - 编辑菜单
   - 删除菜单
   - 批量删除可后置
   - 启用 / 禁用
4. 表单规则：
   - `parentId=0` 表示根节点
   - `LINK` 类型填写 `externalUrl`
   - `LINK` 类型 `component` 可为空
   - `permissionCode` 非空时由后端保证唯一，前端展示错误即可
5. 图标映射：
   - 后端返回字符串，如 `setting`、`user`
   - 前端映射为 lucide 图标
   - 未匹配时使用默认图标
6. 内置菜单保护：
   - `isBuiltin=1` 禁止删除
   - `isBuiltin=1` 不建议修改关键标识字段

## 验收标准

- 菜单列表不再读取 mock
- 菜单类型使用 `DIR/MENU/LINK`
- 可见性 `visible` 可筛选和展示
- 外链字段支持
- 图标字符串能稳定映射
- 执行 `npm run build` 通过
