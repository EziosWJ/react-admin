# 账号页面完善总结

## 修改文件

- `src/pages/account-profile.tsx`
- `src/pages/change-password.tsx`
- `src/router.tsx`
- `src/components/layout/user-menu.tsx`
- `src/config/navigation.ts`
- `src/types/account.ts`
- `src/types/auth.ts`
- `src/types/index.ts`
- `src/mocks/account.ts`
- `src/mocks/auth.ts`
- `src/api/account.ts`
- `src/api/auth.ts`

## 实现内容

### 个人中心

- 路由为 `/account/profile`。
- 页面以信息展示为主，展示：
  - 用户基础信息
  - 账号信息
  - 联系方式
  - 角色信息
  - 最近登录信息
- 使用前端 mock 数据，不接真实接口。
- 保留静态“编辑资料”按钮，未实现弹窗和提交逻辑。
- 复用现有 `PageHeader`、`ContentCard`、`StatusTag`。

### 修改密码

- 路由为 `/account/change-password`。
- 使用 `react-hook-form + zod` 实现基础校验。
- 校验规则：
  - 原密码必填
  - 新密码不少于 6 位
  - 确认密码必须与新密码一致
- 提交后仅展示前端成功提示，不请求接口。
- 复用现有 `FormSection`、`Field`、`Input`、`Button`。

### 用户菜单

- 增加“个人中心”入口。
- 增加“修改密码”入口。
- 保留退出登录入口。
- 路由跳转已同步更新。

### 数据层

- 新增 `src/types/account.ts` 集中管理账号资料类型。
- 新增 `src/mocks/account.ts` 存放账号 mock 数据。
- 新增 `src/api/account.ts` 作为账号页面的数据访问层。
- 认证相关 mock 保持在 `src/mocks/auth.ts`，登录 API 保持在 `src/api/auth.ts`。

## 验证结果

已执行：

```bash
npm run build
```

结果：构建通过，无异常。

## 未完成事项

- 个人中心“编辑资料”按钮仍为静态按钮。
- 修改密码未接真实后端接口。
- 未实现真实账号资料更新和密码修改逻辑。
