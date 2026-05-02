# 任务 02：认证模块对接

## 目标

将当前 mock 登录改造为真实后端登录，完成 Token 保存、当前用户信息获取、退出登录和 401 处理。

## 参考文档

- `docs/frontend-api-guide.md` 的“认证模块”
- `docs/BACKEND_INTEGRATION_CHECKLIST.md`
- `task/00-api-infrastructure.md`

## 前置依赖

- 任务 00 已完成，提供 `src/lib/http.ts` 和 `src/types/api.ts`

## 负责范围

主要负责：

- `src/api/auth.ts`
- `src/store/auth-store.ts`
- `src/types/auth.ts`
- `src/types/index.ts`
- `src/pages/login.tsx`
- `src/components/auth/require-auth.tsx`
- `src/components/layout/user-menu.tsx`
- 可选：`src/components/layout/app-header.tsx`

避免修改：

- 用户管理页面
- 角色、菜单、字典等业务模块页面
- 动态路由完整实现

## 后端接口

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/auth/menus`

## 实现要求

1. 定义认证类型：
   - `LoginRequest`
   - `LoginResponse`
   - `CurrentUser`
   - `CurrentUserDept`
   - `CurrentUserRole`
   - `AuthState`
2. 登录流程：
   - 调用 `POST /api/auth/login`
   - 保存 `tokenValue`
   - 调用 `GET /api/auth/me`
   - 保存当前用户信息
   - 跳转原目标页面
3. 退出流程：
   - 尝试调用 `POST /api/auth/logout`
   - 无论接口是否成功，都清理本地 token 和用户信息
   - 跳转登录页
4. 401 处理：
   - 注册到 HTTP 层
   - 清理认证状态
   - 跳转 `/login`
5. 持久化：
   - localStorage 保存 token 和当前用户信息
   - 启动时可恢复登录态
6. 用户展示：
   - `UserMenu` 使用 `nickname`、`username`、`avatar`
   - 缺头像时保持现有 fallback

## 暂不实现

- 完整动态菜单
- 完整动态路由
- RBAC 权限系统
- refresh token，后端滑动续期，前端只处理 401

## 验收标准

- 登录页不再依赖 mock 登录
- 登录成功后能获取并展示当前用户信息
- 退出登录会清理 token
- 401 能回到登录页
- 执行 `npm run build` 通过

## 注意事项

- 后端 `tokenValue` 已包含 `Bearer ` 前缀，保存和发送时不要重复拼接。
- `GET /api/auth/menus` 可以先封装 API，但不必在本任务中改造动态菜单。
