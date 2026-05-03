# React Admin Template

React 后台管理系统前端模板，基于真实后端接口对接，提供完整的系统管理能力。

## 技术栈

- **构建工具**：Vite 6
- **前端框架**：React 19 + TypeScript
- **样式方案**：Tailwind CSS + CSS design tokens
- **路由**：React Router 7
- **全局状态**：Zustand
- **表单方案**：react-hook-form + zod + @hookform/resolvers
- **图标**：lucide-react
- **基础组件**：按 shadcn/ui 组合方式封装的本地组件

## 运行命令

```bash
npm install
npm run dev       # 启动开发服务器
npm run build     # 类型检查 + 构建
npm run lint      # ESLint 检查
npm run preview   # 预览构建产物
```

## 项目结构

```
src/
  api/                # 后端接口封装
    auth.ts           # 认证：登录、退出、当前用户、菜单
    user.ts           # 用户管理
    rbac.ts           # 角色与菜单管理
    dept.ts           # 部门管理
    system.ts         # 字典与系统配置
    file.ts           # 文件上传与管理
    log.ts            # 登录日志与操作日志
    account.ts        # 个人中心
  components/
    auth/             # 认证守卫：RequireAuth、PermissionGuard
    common/           # 公共组件：DataTable、Pagination、Toast 等
    layout/           # 布局：AppShell、AppSidebar、AppHeader
    ui/               # 基础 UI：Button、Input、Select、Switch 等
  config/
    navigation.ts     # 侧边栏菜单与路由标题映射
  lib/
    http.ts           # 统一 HTTP 请求封装（fetch）
    api-error.ts      # 统一错误模型
    menu-icons.ts     # 后端图标字符串 → lucide 图标映射
    error.ts          # 错误消息提取工具
    datetime.ts       # 日期时间格式化
    utils.ts          # 通用工具函数
  mocks/              # 残留 mock 数据（逐步废弃）
  pages/
    system/           # 系统管理页面（按模块子目录拆分）
      users/          # 用户管理
      roles/          # 角色管理
      menus/          # 菜单管理
      depts/          # 部门管理
      dicts/          # 字典管理
      configs/        # 配置管理
      files/          # 文件管理
      logs/           # 日志管理（登录日志、操作日志）
    examples/         # 页面示例（列表、树、详情等 Demo）
    login.tsx         # 登录页
    dashboard.tsx     # Dashboard
    account-profile.tsx
    change-password.tsx
  store/
    auth-store.ts     # 认证状态（token、用户、动态菜单）
  styles/
    globals.css       # 全局样式与 design tokens
  types/              # TypeScript 类型定义
    api.ts            # 统一 API 响应、分页类型
    auth.ts           # 认证相关类型
    user.ts           # 用户类型
    rbac.ts           # 角色、菜单类型
    dept.ts           # 部门类型
    system.ts         # 字典、配置类型
    file.ts           # 文件类型
    log.ts            # 日志类型
```

## 功能模块

### 认证与权限

- 登录 / 退出（对接 `POST /api/auth/login`、`POST /api/auth/logout`）
- Token 自动注入与 401 拦截跳转
- 当前用户信息获取与持久化
- 动态侧边栏菜单（`GET /api/auth/menus`）
- 路由守卫 `RequireAuth`

### 系统管理

| 模块 | 路由 | 说明 |
|------|------|------|
| 用户管理 | `/system/user` | CRUD、启停、角色分配、重置密码 |
| 角色管理 | `/system/role` | CRUD、启停、菜单权限分配 |
| 菜单管理 | `/system/menu` | 目录 / 菜单 / 外链三级结构，图标映射 |
| 部门管理 | `/system/dept` | 树形部门管理，支持选择器供用户模块复用 |
| 字典管理 | `/system/dict` | 字典类型 + 字典数据两级管理，通用字典项查询 |
| 配置管理 | `/system/config` | 系统配置键值对管理 |
| 文件管理 | `/system/file` | 上传、预览、下载、元数据编辑 |
| 登录日志 | `/system/login-log` | 登录记录查询，开发环境可清空 |
| 操作日志 | `/system/oper-log` | 操作记录查询，含请求/响应摘要 |

### 个人中心

- 个人信息展示与头像修改（`/account/profile`）
- 修改密码（`/account/change-password`）

### 页面示例

- 表单示例（`/forms/basic`）
- 列表页 Demo（`/examples/list`）
- 树形结构 Demo（`/examples/tree`）
- 左树右表 Demo（`/examples/tree-table`）
- 详情页 Demo（`/examples/detail`）

## 后端接口约定

- 统一前缀：`/api`
- 成功响应：`{ code: 200, message: "success", data }`
- 分页响应：`data.records`、`data.total`、`data.page`、`data.pageSize`
- 认证头：`Authorization: Bearer <token>`（后端返回的 `tokenValue` 已含 `Bearer ` 前缀）
- 状态字段：`1=启用`、`0=禁用`
- 字段命名：camelCase
- Token 有效期 2 小时，滑动续期，前端仅处理 401

完整接口文档见 `docs/frontend-api-guide.md`，开发环境可通过 Knife4j 查看：`http://localhost:8080/doc.html`

## 表单绑定方式

本项目使用 `react-hook-form` + `zod` 作为统一表单方案。

**普通输入组件**使用 `register` 绑定：

```tsx
<Input {...register("name")} />
```

`Input`、`Select`、`Textarea` 已增加 `forwardRef`，`react-hook-form` 可直接透传 `ref`。

**自定义受控组件**使用 `Controller` 绑定：

```tsx
<Controller
  control={control}
  name="enabled"
  render={({ field }) => (
    <Switch checked={field.value} onCheckedChange={field.onChange} />
  )}
/>
```

**校验规则**集中定义在 Zod schema 中：

```tsx
const form = useForm<FormValues>({
  resolver: zodResolver(formSchema),
  defaultValues,
  mode: "onBlur",
});
```

**错误展示**复用 `Field` 组件：

```tsx
<Field label="配置名称" error={errors.name?.message}>
  <Input {...register("name")} />
</Field>
```

## HTTP 请求层

`src/lib/http.ts` 封装了原生 `fetch`，提供 `http.get`、`http.post`、`http.put`、`http.patch`、`http.delete` 方法，支持 JSON、FormData 和 blob 下载。不引入 axios。

通过 `setAuthTokenGetter` 注入 token，通过 `setUnauthorizedHandler` 注册 401 处理，与业务模块解耦。

## 公共组件

| 组件 | 说明 |
|------|------|
| `DataTable` | 数据表格，支持 loading、empty、columns |
| `Pagination` | 分页器 |
| `SearchFilterBar` | 列表筛选条件栏 |
| `TableToolbar` | 表格标题与操作栏 |
| `PageHeader` | 页面标题区 |
| `ContentCard` | 内容卡片容器 |
| `StatusTag` / `ApiStatusTag` | 状态标签 |
| `EmptyState` | 空态占位 |
| `ConfirmDialog` | 确认弹窗（支持 danger 模式） |
| `FormDialog` | 表单弹窗壳 |
| `DetailDialog` / `DetailItem` | 详情弹窗与字段展示 |
| `Toast` | 消息提示（success / error / warning / info） |
| `TreeSelect` | 单选树（部门选择、父级菜单选择） |
| `TreeCheckList` | 多选树（角色分配菜单） |
| `FileUpload` | 文件上传组件 |
| `Field` | 表单字段标签 + 错误信息 |
| `FormSection` | 表单分组卡片 |

## 开发环境

- 前端地址：`http://localhost:5173`
- 后端地址：`http://localhost:8080`
- API 文档：`http://localhost:8080/doc.html`（Knife4j）
- CORS 已在后端配置允许跨域

## 初始账号

| 账号 | 密码 | 说明 |
|------|------|------|
| admin | admin123 | 超级管理员 |
