# 后端接口对接任务拆解

本目录用于把 `docs/BACKEND_INTEGRATION_CHECKLIST.md` 和 `docs/frontend-api-guide.md` 中的工作拆成可独立分配给 agents 的任务。

## 推荐执行顺序

1. `00-api-infrastructure.md`：API 基础设施
2. `01-common-components.md`：公共基础组件
3. `02-auth-integration.md`：认证模块对接
4. `03-user-module.md`：用户管理模块
5. `07-dept-module.md`：部门管理模块
6. `04-role-module.md`：角色管理模块
7. `05-menu-module.md`：菜单管理模块
8. `06-dict-module.md`：字典管理模块
9. `08-file-module.md`：文件上传与文件管理
10. `11-account-profile-module.md`：个人中心与当前用户能力
11. `09-log-module.md`：日志管理模块
12. `10-route-navigation-alignment.md`：路由与导航对齐
13. `12-system-config-follow-up.md`：系统配置模块确认与迁移
14. `13-issue-fix.md`：页面测试问题修复与交互优化
15. `14-page-refactor-common-foundation.md`：页面拆分公共基础提取
16. `15-page-refactor-users.md`：用户管理页面拆分
17. `16-page-refactor-dicts.md`：字典管理页面拆分
18. `17-page-refactor-roles.md`：角色管理页面拆分
19. `18-page-refactor-menus.md`：菜单管理页面拆分
20. `19-page-refactor-depts-and-logs.md`：部门与日志页面拆分
21. `20-page-refactor-router-cleanup.md`：页面目录迁移后的路由导入清理
22. `21-system-config-integration.md`：系统配置模块真实接口迁移
23. `22-file-management-page.md`：文件管理页面
24. `23-page-compat-cleanup.md`：旧页面兼容导出与无影响残留清理
25. `24-auth-dynamic-navigation.md`：当前用户动态侧边栏菜单

## 并行建议

可以优先并行：

- `00-api-infrastructure.md`
- `01-common-components.md`

在基础设施完成后，可以并行：

- `03-user-module.md`
- `04-role-module.md`
- `05-menu-module.md`
- `06-dict-module.md`
- `07-dept-module.md`

需要谨慎并行：

- `10-route-navigation-alignment.md` 会集中修改 `router.tsx` 和 `navigation.ts`，建议最后统一集成。
- `11-account-profile-module.md` 依赖认证和文件上传。
- `12-system-config-follow-up.md` 依赖后端补充系统配置接口。
- `22-file-management-page.md` 会修改 `router.tsx` 和 `navigation.ts`，建议不要和其他路由集成任务并行。
- `23-page-compat-cleanup.md` 是页面拆分收尾清理，应在任务 14-22 相关路由调整完成后执行。
- `24-auth-dynamic-navigation.md` 会修改认证 store、侧边栏和导航配置，建议不要和路由导航任务并行。

## 分配原则

- 每个 agent 应严格遵守对应任务文件的“负责范围”。
- 遇到需要修改非负责范围文件时，应先记录原因，再由集成任务统一处理。
- 所有任务完成后都应执行 `npm run build`。
- 不要在模块任务中引入新 UI 框架、动态路由、完整 RBAC 或 TanStack Query。

## 页面拆分后续任务

任务 14-20 用于处理 `src/pages` 目录下业务页面过大、平铺过多的问题。

推荐执行顺序：

1. `14-page-refactor-common-foundation.md`：先补公共弹窗、详情展示、状态标签和错误工具。
2. `15-page-refactor-users.md`：拆分用户管理页面。
3. `16-page-refactor-dicts.md`：拆分字典管理页面。
4. `17-page-refactor-roles.md`：拆分角色管理页面。
5. `18-page-refactor-menus.md`：拆分菜单管理页面。
6. `19-page-refactor-depts-and-logs.md`：拆分部门与日志页面。
7. `20-page-refactor-router-cleanup.md`：最后统一清理路由导入和旧兼容文件。
8. `21-system-config-integration.md`：根据后端最新 `docs/config-api.md` 迁移系统配置真实接口。
9. `22-file-management-page.md`：根据 `docs/frontend-api-guide.md` 补齐文件管理页面。
10. `23-page-compat-cleanup.md`：删除安全的旧 re-export 页面文件，清理无业务影响的旧路径残留。
11. `24-auth-dynamic-navigation.md`：使用 `GET /api/auth/menus` 驱动侧边栏业务菜单，保留默认 Dashboard 和 Demo。

并行建议：

- 任务 14 应先完成。
- 任务 15-19 在任务 14 后可以并行执行，因为各自负责不同页面文件和新目录。
- 任务 20 必须最后执行，避免和模块拆分任务同时修改 `src/router.tsx`。
- 任务 21 可以独立执行；如果同时进行页面拆分，建议等任务 14 完成后再做。
- 任务 22 会新增文件管理路由和导航，建议避开任务 20、23 同时执行。
- 任务 23 是收尾清理任务，应在确认路由已改为新目录导入后执行。
- 任务 24 会改造侧边栏菜单来源，应在路由和导航 path 基本稳定后执行。

拆分约定：

- 模块任务不要直接修改 `src/router.tsx`。
- 原有平铺页面文件先保留为 re-export 兼容层。
- 待所有模块拆分完成后，再由任务 20 统一清理导入路径。
- 任务 23 执行后，确认安全的旧 re-export 文件应删除；URL path 兼容仍可保留。

## 已完成修复任务

- `13-issue-fix.md` 记录的是一次已完成的页面交互修复任务，内容包括侧边栏一级菜单折叠、退出登录入口收敛、字典页布局优化、时间格式统一和重置密码异常修复。
- 该任务文件用于回溯问题和交付记录，不作为当前基础对接任务的前置依赖。
