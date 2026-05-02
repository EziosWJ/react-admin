# React Admin 设计方案、实现计划与迭代记录

## 1. 项目目标

本项目作为 React 后台管理系统前端基础模板，第一版只实现可复用的基础骨架、登录流程、主要页面类型和公共组件，不接真实后端，不实现复杂权限系统。

核心目标：

- 结构清晰，便于后续扩展到不同业务系统。
- UI 风格中性、专业、高密度、弱装饰。
- 页面和组件优先复用 `design-system/MASTER.md` 中的规范。
- 功能边界保持克制，不提前引入复杂能力。

## 2. 技术方案

- 构建工具：Vite
- 前端框架：React + TypeScript
- 样式方案：Tailwind CSS + CSS design tokens
- 基础组件：按 shadcn/ui 的组合方式封装本地基础组件
- 路由：React Router
- 全局状态：Zustand
- 图标：lucide-react
- 第一版认证：mock 登录 + localStorage 登录态

## 3. 路由方案

公开路由：

- `/login`：登录页

受保护路由：

- `/`：重定向到 `/dashboard`
- `/dashboard`：Dashboard 示例页
- `/users`：用户管理列表页示例
- `/forms/basic`：表单示例页
- `/settings`：系统设置占位页

兜底路由：

- `*`：404 页面

受保护路由统一通过 `RequireAuth` 判断登录态。未登录访问后台页面时跳转到 `/login`。

## 4. 布局方案

后台主界面采用经典结构：

- `AppShell`：整体布局容器。
- `AppSidebar`：左侧导航，默认展开，支持折叠。
- `AppHeader`：顶部栏，包含折叠按钮、面包屑、静态搜索入口、用户菜单和退出登录。
- `main`：主内容区，统一背景、内边距和内容宽度规则。

第一版不实现多标签页、不实现动态菜单、不实现暗色模式。

## 5. 组件方案

第一版公共组件：

- `AppShell`
- `AppHeader`
- `AppSidebar`
- `PageHeader`
- `ContentCard`
- `StatusTag`
- `EmptyState`
- `RequireAuth`
- `SearchFilterBar`
- `FormSection`
- `UserMenu`
- `Breadcrumbs`

组件边界以页面复用为准，不做过度抽象。

## 6. 页面方案

### 登录页

居中卡片布局，包含系统名称、用户名、密码、记住我、登录按钮和基础校验。

mock 账号：

- 用户名：`admin`
- 密码：`admin123`

### Dashboard

展示 KPI 卡片、趋势图占位、最近操作、系统状态和待办信息，数据来自本地 mock。

### 用户管理列表

展示 PageHeader、筛选区、表格、状态标签、操作按钮、分页，以及基础空态结构。

### 表单示例

展示分组表单卡片、输入框、下拉、开关、文本域、提交和重置按钮。第一版只做前端反馈。

### 404

展示基础异常页面和返回首页按钮。

## 7. 样式策略

基础 token 写入 `src/styles/globals.css`，映射颜色、圆角、阴影和字体。

执行规则：

- 页面背景使用浅灰色。
- 卡片使用白底、细边框、弱阴影。
- 主色只用于关键操作和导航激活态。
- 使用 4px 基准栅格。
- 表格和表单优先保证信息密度和可读性。

## 8. 实施顺序

1. 创建工程配置和全局样式。
2. 创建认证 store、路由配置和 mock 数据。
3. 实现布局和公共组件。
4. 实现登录页与受保护页面。
5. 执行依赖安装、类型检查和构建验证。

## 9. 已完成迭代

### 第一版基础骨架

- 阅读并落实 `NEED.md` 的第一版需求。
- 阅读并遵循 `design-system/MASTER.md` 的后台管理系统 UI/UX 规范。
- 创建 React + TypeScript + Vite + Tailwind CSS 工程骨架。
- 配置基础 design tokens 和全局样式。
- 实现 mock 登录流程：
  - 用户名：`admin`
  - 密码：`admin123`
  - 登录态保存到 `localStorage`
  - 退出登录清除登录态
- 实现登录态路由守卫 `RequireAuth`。
- 实现经典后台布局：
  - `AppShell`
  - `AppHeader`
  - `AppSidebar`
  - 内容区统一结构
- 实现 Sidebar 默认展开和折叠。
- 实现 Header 中的折叠按钮、面包屑、静态全局搜索入口、用户信息和退出登录。
- 使用本地静态菜单配置：
  - Dashboard
  - 用户管理
  - 表单示例
  - 系统设置
- 实现第一版页面：
  - 登录页
  - Dashboard 示例页
  - 用户管理列表页示例
  - 表单示例页
  - 系统设置占位页
  - 404 页面
- 抽取第一版公共组件：
  - `PageHeader`
  - `ContentCard`
  - `StatusTag`
  - `EmptyState`
  - `FormSection`
  - `Field`
  - 基础 `Button`、`Input`、`Select`、`Textarea`、`Switch`、`Checkbox`

### 第二版列表能力增强

- 新增通用 `DataTable` 组件。
- `DataTable` 支持：
  - `loading`
  - `empty`
  - `columns`
  - `dataSource`
  - `rowKey`
- 新增 `SearchFilterBar` 组件，用于统一承载列表筛选条件和筛选操作。
- 新增 `TableToolbar` 组件，用于统一承载表格标题、说明和表格级操作。
- 用户管理页面已替换原有手写静态表格，改为使用：
  - `SearchFilterBar`
  - `TableToolbar`
  - `DataTable`
- 用户管理页面继续使用本地 mock 数据。
- 未接入真实后端。
- 未引入新的 UI 库。
- 保持现有后台 UI/UX 规范和视觉风格。

### 统一表单能力

- 引入表单相关依赖：
  - `react-hook-form`
  - `zod`
  - `@hookform/resolvers`
- 改造表单示例页，使用 React Hook Form 管理表单状态、错误和提交状态。
- 使用 Zod schema 集中定义基础校验规则：
  - 必填
  - 长度限制
  - 邮箱格式
  - 选择项校验
- 提交时展示 loading 状态。
- 提交成功后展示静态成功提示。
- 不接真实接口。
- 保持现有 `Field`、`FormSection`、`Input`、`Select`、`Textarea`、`Switch` 等基础组件职责不变。
- `Input`、`Select`、`Textarea` 增加 `forwardRef`，以支持 `react-hook-form` 的 `register` 绑定。
- `Switch` 通过 `Controller` 与 React Hook Form 绑定。
- 新增 `README.md`，说明 React Hook Form 与当前基础组件的绑定方式。

### 数据访问层整理

- 新增 `src/api` 目录：
  - `api/auth.ts`
  - `api/user.ts`
- 新增 `src/mocks` 目录：
  - `mocks/auth.ts`
  - `mocks/users.ts`
- 新增 `src/types` 目录：
  - `types/auth.ts`
  - `types/user.ts`
  - `types/table.ts`
  - `types/index.ts`
- 将登录 mock 逻辑从 `auth-store` 中抽离到 `mocks/auth.ts`。
- 将用户列表 mock 数据和筛选逻辑从用户管理页面中抽离到 `mocks/users.ts`。
- 用户管理页面改为通过 `api/user.ts` 获取数据。
- 登录状态 store 改为通过 `api/auth.ts` 执行 mock 登录。
- 领域类型集中放到 `src/types`，页面和 API 通过统一类型引用。
- 暂不接真实后端，当前 API 层仍然读取本地 mock。

## 10. 验证结果

第一版由用户手动执行并确认：

- `npm run build` 成功
- 本地运行成功
- 暂无异常

后续增强均已执行并通过：

- `npm run build`

## 11. 当前边界

- 不接真实后端。
- 不实现复杂权限系统和 RBAC。
- 不实现动态菜单。
- 不实现多标签页。
- 不实现暗色模式。
- 图表区域使用占位展示，暂不引入图表库。
- 移动端仅做基础响应式。
- 表单提交为静态前端反馈，不请求接口。
- 列表分页仍为静态结构，未接真实分页参数。

## 12. 后续可扩展方向

- 接入真实登录接口和 token 刷新机制。
- 基于业务系统扩展动态路由和菜单。
- 将 `src/api/auth.ts` 和 `src/api/user.ts` 中的 mock 调用替换为真实 HTTP 请求。
- 增加统一 HTTP client，集中处理 baseURL、headers、错误码、token 注入和响应解析。
- 为用户列表补充真实分页、排序、批量选择和错误状态。
- 引入图表库完善 Dashboard。
- 将表单提交接入真实接口，并补充接口错误回填。
- 增加页面级加载、错误和权限状态。
