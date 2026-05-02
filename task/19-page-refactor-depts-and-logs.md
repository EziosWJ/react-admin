# 任务 19：部门与日志页面拆分

## 目标

拆分中等规模页面，重点处理部门管理和日志管理，保持目录结构清晰。

## 前置依赖

- 任务 14：页面拆分公共基础提取

如果任务 14 尚未合并，本任务可以先保留局部 `DetailItem` 等实现。

## 负责范围

主要负责：

- `src/pages/system-depts.tsx`
- `src/pages/system-login-logs.tsx`
- `src/pages/system-oper-logs.tsx`
- `src/pages/system/depts/index.tsx`
- `src/pages/system/depts/columns.tsx`
- `src/pages/system/depts/schema.ts`
- `src/pages/system/depts/dept-form-dialog.tsx`
- `src/pages/system/logs/login-logs.tsx`
- `src/pages/system/logs/oper-logs.tsx`
- `src/pages/system/logs/login-log-detail-dialog.tsx`
- `src/pages/system/logs/oper-log-detail-dialog.tsx`

可按需新增：

- `src/pages/system/depts/utils.ts`
- `src/pages/system/logs/utils.ts`

避免修改：

- `src/router.tsx`
- `src/api/dept.ts`
- `src/api/log.ts`
- 用户、角色、菜单、字典页面

## 拆分方式

保留旧页面文件作为兼容导出：

```ts
export { SystemDeptsPage } from "@/pages/system/depts";
export { SystemLoginLogsPage } from "@/pages/system/logs/login-logs";
export { SystemOperLogsPage } from "@/pages/system/logs/oper-logs";
```

旧文件分别是：

- `src/pages/system-depts.tsx`
- `src/pages/system-login-logs.tsx`
- `src/pages/system-oper-logs.tsx`

## 建议文件职责

部门模块：

- `system/depts/index.tsx`：页面主状态、请求、布局
- `system/depts/columns.tsx`：部门表格列
- `system/depts/schema.ts`：表单 schema、payload、查询参数
- `system/depts/dept-form-dialog.tsx`：部门表单弹窗

日志模块：

- `system/logs/login-logs.tsx`：登录日志列表页
- `system/logs/oper-logs.tsx`：操作日志列表页
- `system/logs/*-detail-dialog.tsx`：详情弹窗
- `system/logs/utils.ts`：状态文案、操作类型文案、摘要格式化等

## 实现要求

- 拆分后行为保持一致
- 日志时间格式继续使用 `src/lib/datetime.ts`
- 日志详情字段不回退到旧字段名
- 不改变清空日志仅开发环境显示的规则
- 不引入新依赖

## 验收标准

- `/system/dept`、`/system/depts` 可正常访问部门管理
- `/system/login-log` 可正常访问登录日志
- `/system/oper-log` 可正常访问操作日志
- 旧页面文件只保留兼容导出
- 执行 `npm run build` 通过
- 执行 `npm run lint` 无新增 error

## 注意事项

- 本任务覆盖三个页面，执行时按“部门、登录日志、操作日志”顺序逐个拆，避免一次性大改后难以定位问题。
- 不要把日志和部门抽成同一个页面框架。
