# 任务 11：个人中心与当前用户能力

## 目标

将个人中心、修改密码、头像修改对接真实后端接口，并复用认证模块中的当前用户信息。

## 参考文档

- `docs/frontend-api-guide.md` 的“认证模块”
- `docs/frontend-api-guide.md` 的“用户管理”
- `docs/frontend-api-guide.md` 的“文件管理”

## 前置依赖

- 任务 02：认证模块对接
- 任务 08：文件上传与文件管理，至少提供上传 API
- 任务 01：公共基础组件中的 `Toast`

## 负责范围

主要负责：

- `src/api/account.ts`
- `src/pages/account-profile.tsx`
- `src/pages/change-password.tsx`
- `src/types/account.ts`
- `src/types/auth.ts`，仅当前用户相关字段小幅配合

可按需使用：

- `src/api/file.ts`
- `src/api/user.ts`
- `src/store/auth-store.ts`

避免修改：

- 登录页主流程
- 用户管理列表
- 文件管理页面

## 后端接口

- `GET /api/auth/me`
- `PUT /api/system/user/me/password`
- `PUT /api/system/user/me/avatar`
- `POST /api/system/file/upload`

## 实现要求

1. 个人中心：
   - 展示当前用户 `nickname`、`username`、`avatar`、`phone`、`email`、`dept`、`roles`、`lastLoginTime`、`lastLoginIp`
   - 数据优先来自 `auth-store`
   - 可提供刷新当前用户信息能力
2. 修改密码：
   - 请求体 `{ oldPassword, newPassword }`
   - 使用 `react-hook-form` 和 `zod`
   - 后端字段错误映射到表单
   - 成功后提示
3. 修改头像：
   - 先上传文件获取 `accessUrl`
   - 再调用 `PUT /api/system/user/me/avatar`
   - 成功后更新当前用户信息

## 验收标准

- 个人中心不再读取 mock account 数据
- 修改密码调用真实接口
- 头像上传流程符合后端协议
- 成功后用户菜单头像或昵称能同步更新
- 执行 `npm run build` 通过

## 注意事项

- 不要在本任务中改造完整用户管理。
- 如果文件上传任务未完成，本任务可先只完成修改密码和个人信息展示。
