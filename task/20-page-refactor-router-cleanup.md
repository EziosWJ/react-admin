# 任务 20：页面目录迁移后的路由导入清理

## 目标

在各页面拆分任务完成后，统一清理 `src/router.tsx` 的页面导入路径，并评估是否删除旧的兼容 re-export 文件。

本任务是集成收尾任务，不应与任务 15-19 并行执行。

## 前置依赖

- 任务 15：用户管理页面拆分
- 任务 16：字典管理页面拆分
- 任务 17：角色管理页面拆分
- 任务 18：菜单管理页面拆分
- 任务 19：部门与日志页面拆分

## 负责范围

主要负责：

- `src/router.tsx`
- `src/pages/users.tsx`
- `src/pages/system-dicts.tsx`
- `src/pages/system-roles.tsx`
- `src/pages/system-menus.tsx`
- `src/pages/system-depts.tsx`
- `src/pages/system-login-logs.tsx`
- `src/pages/system-oper-logs.tsx`

可按需调整：

- `src/pages/account-profile.tsx`
- `src/pages/change-password.tsx`
- `src/pages/form-example.tsx`

避免修改：

- 各模块目录内部实现
- `src/api/**`
- `src/types/**`
- 公共组件

## 实现要求

1. 将 `src/router.tsx` 的页面导入改为新目录：

```ts
import { UsersPage } from "@/pages/system/users";
import { SystemDictsPage } from "@/pages/system/dicts";
import { SystemRolesPage } from "@/pages/system/roles";
import { SystemMenusPage } from "@/pages/system/menus";
import { SystemDeptsPage } from "@/pages/system/depts";
import { SystemLoginLogsPage } from "@/pages/system/logs/login-logs";
import { SystemOperLogsPage } from "@/pages/system/logs/oper-logs";
```

2. 确认没有其他地方依赖旧页面文件。
3. 如果确认安全，可以删除旧的兼容 re-export 文件。
4. 如果仍有引用，保留兼容导出，并在最终说明中列出。

## 验收标准

- 所有路由仍可正常访问
- `rg "@/pages/system-dicts|@/pages/system-roles|@/pages/system-menus|@/pages/system-depts|@/pages/system-login-logs|@/pages/system-oper-logs|@/pages/users"` 无旧导入残留，除非明确保留兼容
- 执行 `npm run build` 通过
- 执行 `npm run lint` 无新增 error

## 注意事项

- 本任务只做集成收尾，不再拆业务组件。
- 不要调整路由 path。
- 不要引入懒加载，除非用户另行要求。
