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

## 分配原则

- 每个 agent 应严格遵守对应任务文件的“负责范围”。
- 遇到需要修改非负责范围文件时，应先记录原因，再由集成任务统一处理。
- 所有任务完成后都应执行 `npm run build`。
- 不要在模块任务中引入新 UI 框架、动态路由、完整 RBAC 或 TanStack Query。
