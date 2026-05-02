# 任务 09：日志管理模块

## 目标

新增登录日志和操作日志 API 与页面，用于查看系统登录和操作记录。

## 参考文档

- `docs/frontend-api-guide.md` 的“日志管理”
- `docs/BACKEND_INTEGRATION_CHECKLIST.md`

## 前置依赖

- 任务 00：API 基础设施
- 任务 01：公共基础组件中的 `Pagination`、`ConfirmDialog`、`Toast`

## 负责范围

主要负责：

- `src/api/log.ts`
- `src/types/log.ts`
- `src/types/index.ts`
- `src/pages/system-login-logs.tsx`
- `src/pages/system-oper-logs.tsx`
- `src/router.tsx`
- `src/config/navigation.ts`

避免修改：

- 认证模块
- 用户、角色、菜单、字典页面

## 后端接口

登录日志：

- `GET /api/system/login-log/page`
- `GET /api/system/login-log/{id}`
- `DELETE /api/system/login-log/clear`

操作日志：

- `GET /api/system/oper-log/page`
- `GET /api/system/oper-log/{id}`
- `DELETE /api/system/oper-log/clear`

## 实现要求

1. 登录日志类型：
   - `id`
   - `username`
   - `loginStatus`
   - `loginIp`
   - `browser`
   - `os`
   - `message`
   - `loginTime`
2. 操作日志类型：
   - `id`
   - `moduleName`
   - `operationType`
   - `requestMethod`
   - `requestUrl`
   - `operatorName`
   - `operatorIp`
   - `operationStatus`
   - `costTime`
   - `operationTime`
   - 详情中的请求参数摘要和响应结果摘要
3. 页面能力：
   - 登录日志列表
   - 操作日志列表
   - 详情查看
   - 清空日志
4. 清空按钮：
   - 仅开发环境展示
   - 生产环境不展示，后端生产环境会返回 `403`

## 验收标准

- 两个日志页面可访问
- 分页、筛选、详情可用
- 开发环境清空按钮有确认弹窗
- 执行 `npm run build` 通过

## 注意事项

- 日志模块优先级低于认证、用户、角色、菜单、字典。
