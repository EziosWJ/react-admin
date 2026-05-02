# 任务 10：路由与导航对齐

## 目标

在不一次性引入完整动态路由的前提下，对齐前端静态路由、侧边栏导航与后端菜单路径，减少后续动态菜单改造成本。

## 参考文档

- `docs/frontend-api-guide.md` 的“获取当前用户菜单”
- `docs/BACKEND_INTEGRATION_CHECKLIST.md`

## 前置依赖

- 任务 02 可先封装 `GET /api/auth/menus`
- 菜单模块任务 05 可提供菜单类型和图标映射

## 负责范围

主要负责：

- `src/router.tsx`
- `src/config/navigation.ts`
- `src/components/layout/app-sidebar.tsx`
- `src/components/layout/breadcrumbs.tsx`
- 可选：`src/lib/menu-icons.ts`

避免修改：

- 具体业务页面内部逻辑
- 认证 store，除非仅读取菜单数据

## 实现要求

1. 梳理当前路由和后端菜单路径差异：
   - 当前用户管理：`/users`
   - 后端示例：`/system/user`
2. 给出并实施一种保守方案：
   - 方案 A：保留现有路由，仅在文档中记录映射
   - 方案 B：新增后端路径别名，旧路径重定向
3. 维护静态 `routeTitleMap`。
4. 保持当前第一阶段边界：
   - 不实现完整动态路由
   - 不实现完整 RBAC
   - 不从后端菜单直接生成页面组件
5. 可预留菜单图标字符串映射：
   - `setting`
   - `user`
   - 其他未匹配图标使用默认图标

## 验收标准

- 后台现有页面仍可访问
- 侧边栏高亮和面包屑正常
- 新增模块路由能按约定加入导航
- 执行 `npm run build` 通过

## 注意事项

- 本任务是协调任务，容易与部门、文件、日志模块同时改 `router.tsx` 和 `navigation.ts`。实际分配时建议最后执行，或由一个 agent 统一集成路由导航。
