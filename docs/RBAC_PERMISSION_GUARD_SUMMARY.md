# RBAC 前端权限标识工具层总结

## 修改文件

- `src/lib/permission.ts`
- `src/components/auth/permission-guard.tsx`
- `src/pages/system-permissions.tsx`
- `src/mocks/rbac.ts`

## 实现内容

### 权限工具层

- 新增 `src/lib/permission.ts`。
- 提供基础权限判断函数：
  - `hasPermission(permissionCode: string): boolean`
  - `hasAnyPermission(permissionCodes: string[]): boolean`
  - `hasAllPermissions(permissionCodes: string[]): boolean`
- 第一版基于 mock 当前用户权限编码列表判断，不接真实后端，不接真实登录用户权限。

### 权限展示组件

- 新增 `src/components/auth/permission-guard.tsx`。
- 支持：
  - 单个权限编码
  - 任意一个权限编码
  - 全部权限编码
- 无权限时默认不渲染 `children`。
- 支持可选 `fallback`。

### Mock 权限编码

- 在 `src/mocks/rbac.ts` 中新增当前用户权限编码列表。
- 权限编码与权限点管理页中的 mock 权限编码保持一致。

### 页面示例

- 在权限点管理页面中，将“新增权限点”按钮使用 `PermissionGuard` 包裹，作为最小示例接入。

## 验证结果

已执行：

```bash
npm run build
```

结果：构建通过，无异常。

## 未完成事项

- 未实现真实 RBAC 权限控制。
- 未实现路由级权限拦截。
- 未实现动态菜单过滤。
- 未接真实接口。
- 权限判断仍依赖前端 mock 列表。
