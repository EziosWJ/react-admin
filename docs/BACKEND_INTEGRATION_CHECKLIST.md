# 后端接口对接缺口清单

本文档基于 `docs/frontend-api-guide.md` 和当前前端代码整理，用于指导后续从 mock 数据切换到真实后端接口。

## 1. 已明确的后端协议

后端已完成并明确以下基础约定：

- 接口统一前缀：`/api`
- 成功响应：`{ code: 200, message: "success", data }`
- 失败响应：`{ code, message, data }`
- 分页请求参数：`page`、`pageSize`
- 分页响应字段：`data.records`、`data.total`、`data.page`、`data.pageSize`
- 认证方式：`Authorization: Bearer <token>`
- Token 有效期：2 小时，后端滑动续期
- 401：未登录或 Token 失效，前端只需清理本地状态并跳转登录页
- JSON 字段：统一 `camelCase`
- 通用状态：`status`，`1=启用`，`0=禁用`
- 内置标识：`isBuiltin`，`1=内置`，`0=普通`
- 参数校验失败：`code=400`，`data` 为字段错误映射

因此前端现在不需要再等待基础协议确认，可以开始补 HTTP 基础层和逐步迁移各领域 API。

## 2. 当前前端主要缺口

### 2.1 缺统一 HTTP 请求层

当前 `src/api/*` 直接调用 `src/mocks/*`，还没有真实请求封装。

建议新增：

- `src/lib/http.ts`
- `src/types/api.ts`

`http.ts` 需要支持：

- 使用 `VITE_API_BASE_URL` 作为基础地址，默认可为空，走 Vite 代理或同源 `/api`
- 自动拼接 query 参数
- 自动处理 JSON 请求体
- 自动注入 `Authorization`
- 支持 `FormData` 上传，不手动设置 `Content-Type`
- 解析统一响应格式
- `code !== 200` 时抛出统一错误
- 401 时触发登出和跳转登录页
- 处理文件下载的 blob 响应

第一阶段建议继续用原生 `fetch` 封装，不新增 `axios`。

### 2.2 缺统一 API 类型

建议在 `src/types/api.ts` 定义：

```ts
export type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

export type ApiPageRequest = {
  page: number;
  pageSize: number;
};

export type ApiPageResult<T> = {
  records: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type ApiFieldErrors = Record<string, string>;
```

注意：后端分页字段是 `records`，不是 `list`。前端可以在 API 层保留 `records`，也可以转换成页面更习惯的 `items`，但必须统一。

### 2.3 认证状态需要重构

当前 `src/store/auth-store.ts` 只保存 `AuthUser`，登录接口只返回 mock 用户。

后端真实登录流程应改为：

1. `POST /api/auth/login`
2. 保存 `tokenValue`
3. `GET /api/auth/me`
4. 保存当前用户信息
5. 后续请求自动携带 `Authorization`
6. 退出时调用 `POST /api/auth/logout`，再清理本地状态

需要改造：

- `src/api/auth.ts`
- `src/store/auth-store.ts`
- `src/types/auth.ts`
- `src/components/layout/user-menu.tsx`
- `src/pages/login.tsx`
- `src/components/auth/require-auth.tsx`

建议新增认证类型：

- `LoginResponse`
- `CurrentUser`
- `CurrentUserRole`
- `CurrentUserDept`

当前 `AuthUser` 只有 `username` 和 `displayName`，与后端 `me` 返回的 `nickname`、`avatar`、`roles`、`dept` 不匹配。

### 2.4 前端领域类型与后端字段不匹配

当前 mock 类型为了页面展示做过简化，不能直接对接后端。

需要重点调整：

- `src/types/user.ts`
- `src/types/rbac.ts`
- `src/types/system.ts`
- `src/types/account.ts`

典型不匹配：

- 用户状态：前端是 `"active" | "pending" | "disabled"`，后端是 `1 | 0`
- 用户字段：前端是 `name/account/department/role/lastLogin`，后端是 `username/nickname/deptName/roles/lastLoginTime`
- 角色字段：前端是 `name/code/sort/updatedAt`，后端是 `roleName/roleCode/sortOrder/createTime/isBuiltin`
- 菜单类型：前端是 `"directory" | "menu" | "button"`，后端是 `"DIR" | "MENU" | "LINK"`
- 菜单字段：前端是 `name/routePath/componentPath/permission/sort`，后端是 `menuName/path/component/permissionCode/sortOrder`
- 系统状态：前端是 `"enabled" | "disabled"`，后端是 `1 | 0`
- 字典字段：前端是 `name/code/itemCount/updatedAt`，后端是 `dictName/dictCode/sortOrder/createTime/isBuiltin`

建议做法：

- API 层按后端字段定义 `ApiXXX` 类型。
- 页面层可以逐步直接使用后端字段，减少转换成本。
- 如果为了兼容现有页面短期做 mapper，mapper 应放在 `src/api` 或独立 `src/lib/mapper`，不要散落在 JSX 中。

### 2.5 列表分页能力不足

当前多个列表页仍是 mock 总数和静态分页。

需要补：

- `src/components/common/pagination.tsx`
- 页面查询状态：`page`、`pageSize`、筛选字段、`records`、`total`、`loading`、`error`
- API 返回 `ApiPageResult<T>`

优先改造页面：

1. `src/pages/users.tsx`
2. `src/pages/system-roles.tsx`
3. `src/pages/system-menus.tsx`
4. `src/pages/system-dicts.tsx`
5. `src/pages/system-configs.tsx`

### 2.6 错误态和字段错误未接入

后端参数校验失败会返回：

```json
{
  "code": 400,
  "message": "参数校验失败",
  "data": {
    "username": "用户名不能为空"
  }
}
```

前端需要补：

- `ApiError`
- `fieldErrors` 提取
- 列表加载失败展示
- 表单提交失败时把字段错误映射到 `react-hook-form`
- 403、404、500 的统一提示

当前 `DataTable` 只有 loading 和 empty，没有 error；可以先由页面外层展示错误提示，后续再小幅扩展 `DataTable`。

### 2.7 缺全局反馈和确认组件

真实 CRUD 后需要：

- 操作成功提示
- 操作失败提示
- 删除确认
- 批量删除确认
- 重置密码确认和结果展示
- 内置数据禁用操作提示

建议新增：

- `src/components/common/toast.tsx`
- `src/components/common/confirm-dialog.tsx`

保持轻量实现，不引入大型 UI 框架。

### 2.8 缺树形选择组件

后端提供菜单树和部门树：

- `GET /api/system/menu/tree`
- `GET /api/system/dept/tree`
- `GET /api/system/dept/options`

前端需要树形能力用于：

- 角色分配菜单
- 用户选择部门
- 部门管理
- 菜单管理

建议新增：

- `src/components/common/tree-select.tsx`
- `src/components/common/tree-check-list.tsx`

第一阶段可以先服务角色菜单分配和用户部门选择，不做复杂拖拽排序。

### 2.9 缺字典缓存机制

后端提供前端常用字典接口：

- `GET /api/system/dict/{dictCode}/items`

建议新增：

- `src/api/dict.ts` 或并入 `src/api/system.ts`
- `src/store/dict-store.ts` 或简单模块级缓存

用于：

- 性别 `gender`
- 状态映射
- 表单下拉
- 列表 value 到 label 展示

第一阶段可以做按需缓存，不需要复杂失效策略。

### 2.10 缺文件上传与下载封装

后端已提供：

- `POST /api/system/file/upload`
- `POST /api/system/file/upload-batch`
- `GET /api/system/file/{id}/download`
- `GET /api/system/file/{id}/view`

需要补：

- `src/api/file.ts`
- 文件上传类型 `FileRecord`
- 上传方法支持 `FormData`
- 下载方法支持 blob
- 头像上传流程：上传文件后拿 `accessUrl`，再调用 `PUT /api/system/user/me/avatar`

当前个人中心和头像展示需要后续对齐该协议。

## 3. 模块接口覆盖缺口

### 3.1 认证模块

后端已提供：

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/auth/menus`

前端缺口：

- 尚未保存 token
- 尚未获取当前用户详情
- 尚未处理 401
- 尚未接入后端菜单

注意：项目当前阶段原本不做动态菜单。后端已提供菜单接口，但建议第一阶段仍保留静态路由和静态菜单；可以先调用 `auth/menus` 做权限可见性或后续迭代，不要一次性改成完整动态路由。

### 3.2 用户管理

后端已提供用户分页、详情、新增、修改、删除、批量删除、启停、分配角色、重置密码、修改当前用户密码、修改头像。

前端缺口：

- 当前用户列表路由是 `/users`，后端菜单路径示例是 `/system/user`，需决定是否调整前端路径
- 当前页面只有列表展示，没有新增、编辑、删除、启停、角色分配、重置密码流程
- 用户筛选字段需要从 `keyword/status` 改为 `username/nickname/phone/email/status/deptId`
- 需要部门选择树
- 需要角色选择数据源

### 3.3 角色管理

后端已提供角色分页、详情、新增、修改、删除、批量删除、启停、分配菜单。

前端缺口：

- 当前角色分配页还包含 `permissionIds`，但后端角色分配接口只接收 `menuIds`
- 当前 `Permission` 模块与后端菜单权限模型不一致
- 需要处理 `isBuiltin=1` 禁止删除、禁止修改 `roleCode`
- 角色详情返回 `menuIds`，应作为分配菜单回显来源

### 3.4 菜单管理

后端已提供菜单树、分页、详情、新增、修改、删除、批量删除、启停。

前端缺口：

- 类型字段需要改为 `DIR/MENU/LINK`
- 后端有 `visible`，当前类型没有
- 外链菜单使用 `externalUrl`，当前类型没有
- 内置菜单保护需要接入 `isBuiltin`
- 前端图标字段是后端字符串，需要做本地图标映射

### 3.5 部门管理

后端已提供部门树、部门选择树、分页、详情、新增、修改、删除、批量删除、启停。

前端缺口：

- 当前没有部门管理页面
- 当前没有部门类型
- 当前没有部门 API
- 用户新增/编辑需要依赖部门选择树

建议新增：

- `src/types/dept.ts`
- `src/api/dept.ts`
- `src/pages/system-depts.tsx`

### 3.6 字典管理

后端已提供字典类型和字典数据完整 CRUD，以及按字典编码查询字典项。

前端缺口：

- 当前 `DictTypeRecord`、`DictItemRecord` 字段与后端不一致
- 字典数据分页依赖 `dictTypeId`，当前页面用 `typeCode`
- 缺按 `dictCode` 查询的通用字典项缓存
- 缺新增、编辑、删除、启停流程

### 3.7 文件管理

后端已提供文件上传、批量上传、分页、详情、修改、删除、批量删除、启停、下载、预览。

前端缺口：

- 当前没有文件 API
- 当前没有文件类型
- 当前没有文件管理页面
- 当前没有上传组件
- 当前头像修改还未接真实上传流程

是否新增文件管理页面可后置，但上传 API 和头像上传应优先补。

### 3.8 日志管理

后端已提供登录日志和操作日志分页、详情、清空。

前端缺口：

- 当前没有日志类型
- 当前没有日志 API
- 当前没有登录日志和操作日志页面

建议后置实现。清空按钮仅开发环境展示，生产环境后端会返回 `403`。

### 3.9 系统配置

当前前端已有 `system-configs` 页面和 mock 类型，但 `frontend-api-guide.md` 未列出配置管理接口。

需要确认：

- 后端是否已有系统配置接口但文档未写入
- 如果没有，前端该页面继续保留 mock 或暂不迁移

## 4. 建议新增文件清单

基础层：

- `src/lib/http.ts`
- `src/types/api.ts`
- `src/lib/api-error.ts`，也可合并进 `http.ts`

API 层：

- `src/api/file.ts`
- `src/api/dept.ts`
- `src/api/log.ts`
- 可选：`src/api/dict.ts`

类型层：

- `src/types/dept.ts`
- `src/types/file.ts`
- `src/types/log.ts`

组件层：

- `src/components/common/pagination.tsx`
- `src/components/common/toast.tsx`
- `src/components/common/confirm-dialog.tsx`
- `src/components/common/tree-select.tsx`
- `src/components/common/tree-check-list.tsx`
- 可选：`src/components/common/file-upload.tsx`

页面层：

- `src/pages/system-depts.tsx`
- 可选：`src/pages/system-files.tsx`
- 可选：`src/pages/system-login-logs.tsx`
- 可选：`src/pages/system-oper-logs.tsx`

## 5. 建议改造文件清单

必须改：

- `src/api/auth.ts`
- `src/api/user.ts`
- `src/api/rbac.ts`
- `src/api/system.ts`
- `src/store/auth-store.ts`
- `src/types/auth.ts`
- `src/types/user.ts`
- `src/types/rbac.ts`
- `src/types/system.ts`
- `src/types/index.ts`
- `src/pages/login.tsx`
- `src/pages/users.tsx`
- `src/components/layout/user-menu.tsx`

按模块迁移时改：

- `src/pages/system-roles.tsx`
- `src/pages/system-menus.tsx`
- `src/pages/system-dicts.tsx`
- `src/pages/account-profile.tsx`
- `src/pages/change-password.tsx`
- `src/router.tsx`
- `src/config/navigation.ts`

## 6. 建议落地顺序

1. 补 `src/types/api.ts` 和 `src/lib/http.ts`。
2. 接入 `POST /api/auth/login`、`GET /api/auth/me`、`POST /api/auth/logout`。
3. 改造 `auth-store`，保存 token、当前用户、登录状态，并处理 401。
4. 先保留静态路由和菜单，避免动态菜单一次性扩大改动。
5. 补 `Pagination`，改造用户列表接 `GET /api/system/user/page`。
6. 补基础 `Toast` 和 `ConfirmDialog`，实现用户删除、启停、重置密码等低复杂操作。
7. 补部门 API 和树选择，用于用户筛选和用户表单。
8. 改造角色管理，按后端 `menuIds` 分配菜单，移除或后置当前权限点分配逻辑。
9. 改造菜单管理，补 `DIR/MENU/LINK`、`visible`、`externalUrl`、图标映射。
10. 改造字典管理，并补按 `dictCode` 查询字典项缓存。
11. 补文件上传 API，接入头像上传。
12. 后置实现部门管理、文件管理、登录日志、操作日志页面。

## 7. 暂不建议现在引入的能力

当前阶段仍不建议主动引入：

- TanStack Query
- 动态路由全量生成
- 完整 RBAC 权限系统
- 多租户权限模型
- 大型表格库
- Ant Design、MUI 等新 UI 框架
- 复杂主题系统
- 前端接口代码生成体系

后端虽然已经提供 `GET /api/auth/menus`，但前端模板当前仍应先保证真实登录、真实列表、真实 CRUD 稳定，再评估动态菜单和权限扩展。

## 8. 需要继续向后端确认的点

基础协议大部分已明确，仍建议确认：

- `VITE_API_BASE_URL` 对应的开发环境后端地址是否固定为 `http://localhost:8080`
- 系统配置接口是否已完成，当前文档未列出
- 批量删除使用 `DELETE` 携带 JSON body，后端和代理链路是否稳定支持
- 文件下载失败时是否仍返回 JSON 错误，前端需要区分 blob 和 JSON
- `tokenValue` 已包含 `Bearer ` 前缀，前端是否原样写入 `Authorization`
- 后端菜单 `component` 字符串与当前前端页面组件的映射关系是否需要统一命名
