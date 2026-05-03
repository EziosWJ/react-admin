# 任务 23：旧页面兼容导出与无影响残留清理

## 目标

针对 `docs/TASK_14_21_IMPLEMENTATION_SUMMARY.md` 中的遗留事项，清理页面拆分后不再需要的旧页面兼容导出文件，并处理对业务无影响的旧路径残留。

本任务只做收尾清理，不改变页面功能、路由 path 和业务交互。

## 背景

任务 14-21 已完成页面拆分和路由导入迁移，大部分业务页面已迁入：

```text
src/pages/system/<module>/
```

当前 `src/router.tsx` 已从新目录导入以下页面：

- `@/pages/system/users`
- `@/pages/system/dicts`
- `@/pages/system/roles`
- `@/pages/system/menus`
- `@/pages/system/depts`
- `@/pages/system/logs/login-logs`
- `@/pages/system/logs/oper-logs`
- `@/pages/system/configs`

因此对应的旧平铺 re-export 文件已经没有继续保留的必要。

## 参考文档

- `docs/TASK_14_21_IMPLEMENTATION_SUMMARY.md`
- `task/15-page-refactor-users.md`
- `task/16-page-refactor-dicts.md`
- `task/17-page-refactor-roles.md`
- `task/18-page-refactor-menus.md`
- `task/19-page-refactor-depts-and-logs.md`
- `task/20-page-refactor-router-cleanup.md`
- `task/21-system-config-integration.md`

## 前置依赖

- 任务 14-21 已完成
- `src/router.tsx` 已确认使用新页面目录导入
- 当前不做路由懒加载

## 负责范围

主要负责删除：

- `src/pages/users.tsx`
- `src/pages/system-configs.tsx`
- `src/pages/system-depts.tsx`
- `src/pages/system-dicts.tsx`
- `src/pages/system-login-logs.tsx`
- `src/pages/system-menus.tsx`
- `src/pages/system-oper-logs.tsx`
- `src/pages/system-roles.tsx`

主要负责检查和按需修改：

- `src/router.tsx`
- `src/config/navigation.ts`
- `src/mocks/rbac.ts`

可按需修改：

- `docs/TASK_14_21_IMPLEMENTATION_SUMMARY.md`，如果需要补充本次清理结果

避免修改：

- `src/pages/system/**` 各业务模块实现
- `src/api/**`
- `src/types/**`
- `src/components/**`
- 认证逻辑
- 路由 path
- 导航菜单层级

## 当前不要删除

不要删除：

- `src/pages/system-permissions.tsx`

原因：

- 该文件不是 re-export 兼容层，而是当前权限点管理真实页面。
- `src/router.tsx` 仍直接导入 `@/pages/system-permissions`。
- 如果后续要拆分权限点管理页面，应另起任务迁移到 `src/pages/system/permissions/`，再删除旧入口。

## 实现要求

### 1. 删除旧 re-export 文件

删除前先确认这些文件只包含兼容导出：

```ts
export { XxxPage } from "@/pages/system/xxx";
```

需要删除的文件：

- `src/pages/users.tsx`
- `src/pages/system-configs.tsx`
- `src/pages/system-depts.tsx`
- `src/pages/system-dicts.tsx`
- `src/pages/system-login-logs.tsx`
- `src/pages/system-menus.tsx`
- `src/pages/system-oper-logs.tsx`
- `src/pages/system-roles.tsx`

如果执行时发现某个文件包含真实业务逻辑，不要删除，先在最终说明中列出原因。

### 2. 确认路由导入

检查 `src/router.tsx`：

- 用户管理继续从 `@/pages/system/users` 导入
- 字典管理继续从 `@/pages/system/dicts` 导入
- 角色管理继续从 `@/pages/system/roles` 导入
- 菜单管理继续从 `@/pages/system/menus` 导入
- 部门管理继续从 `@/pages/system/depts` 导入
- 登录日志继续从 `@/pages/system/logs/login-logs` 导入
- 操作日志继续从 `@/pages/system/logs/oper-logs` 导入
- 配置管理继续从 `@/pages/system/configs` 导入

不要调整已有路由 path，例如：

- `/users`
- `/system/user`
- `/system/dict`
- `/system/dicts`
- `/system/config`
- `/system/configs`

这些 path 属于访问地址兼容，不等同于旧页面文件兼容。

### 3. 清理 mock 中旧 componentPath

检查 `src/mocks/rbac.ts` 中的旧组件路径。

如果这些字段只用于 mock 菜单展示或演示，不参与真实动态 import，则可以替换为新目录路径：

- `@/pages/system-dicts` -> `@/pages/system/dicts`
- `@/pages/system-configs` -> `@/pages/system/configs`
- `@/pages/system-roles` -> `@/pages/system/roles`
- `@/pages/system-menus` -> `@/pages/system/menus`

如果执行时发现 `componentPath` 被真实运行时代码用于动态导入，需要先确认映射规则，不要直接修改。

### 4. 搜索旧引用

删除文件和清理 mock 后，执行搜索确认没有运行时代码继续引用旧页面文件：

```bash
rg "@/pages/(users|system-configs|system-depts|system-dicts|system-login-logs|system-menus|system-oper-logs|system-roles)" src
```

允许历史文档和旧任务文档仍保留这些路径说明。

### 5. 保持业务无影响

本任务不改变：

- URL path
- 页面标题
- 菜单名称
- 权限点
- API 调用
- 页面状态逻辑
- 表格、表单、弹窗交互

如果某项清理会影响业务行为，则跳过该项并在最终说明中记录。

## 暂不实现

- 权限点管理页面拆分
- 路由懒加载
- 动态路由
- RBAC 权限模型调整
- mock 数据全面重构
- 删除历史 docs 中对旧路径的描述
- 清理 `dist`

## 验收标准

- 8 个旧 re-export 文件已删除，或明确说明未删除原因
- `src/pages/system-permissions.tsx` 保留
- `src/router.tsx` 不再导入旧 re-export 文件
- `src/mocks/rbac.ts` 中运行态无影响的旧 `componentPath` 已更新
- `rg "@/pages/(users|system-configs|system-depts|system-dicts|system-login-logs|system-menus|system-oper-logs|system-roles)" src` 无匹配
- 原有后台路由仍保持不变
- 执行 `npm run build` 通过
- 执行 `npm run lint` 无新增 error

## 注意事项

- 删除的是旧文件入口，不是删除 URL 兼容路径。
- 不要把 `system-permissions.tsx` 和 re-export 文件混为一类。
- 不要为了本任务顺手迁移权限点管理页面。
- 不要修改历史任务文档中的路径引用，除非用户明确要求清理历史文档。
