我想创建一个 React 后台管理系统前端基础模板，未来作为我开发其他系统的起点。

当前阶段目标：
第一版只实现后台管理系统的基础骨架和主要界面，不实现复杂业务功能，不接真实后端。

请根据以下需求，先完成项目设计方案和实现计划，然后再开始编码。

## 一、技术方案

- React + TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- React Router
- Zustand
- 第一版使用 mock 登录，不接真实后端
- 第一版不做复杂权限系统，只做登录态守卫

## 二、组件与 UI 方案

组件方案使用：

- Tailwind CSS + shadcn/ui

要求：

- shadcn/ui 只作为基础组件来源，不代表最终视觉规范
- 最终视觉风格必须遵守企业后台管理系统设计要求
- 需要基于 shadcn/ui 封装后台业务组件
- 不要直接堆砌原子组件
- 不要做营销官网式风格
- 不要大面积渐变、大插画、大留白
- 页面风格应中性、专业、高密度、弱装饰
- 信息优先于视觉表现
- 操作效率优先于炫技效果

## 三、整体布局要求

采用经典后台结构：

- Header
- Sidebar
- Content

具体要求：

1. Sidebar 默认展开
2. Sidebar 支持折叠
3. 第一版不要 Tabs 多标签页
4. 需要面包屑
5. 全局搜索先做静态入口，不实现真实搜索
6. 第一版不要暗色模式
7. 第一版不要动态菜单，使用本地静态菜单配置
8. 登录页使用居中卡片布局
9. 移动端只做基本响应式，不深度适配
10. 权限只做登录态守卫，不做 RBAC

## 四、第一版必须实现的页面

第一版需要实现：

1. 登录页
2. 后台主布局
3. Dashboard 示例页
4. 列表页示例
5. 表单页示例
6. 404 页面

## 五、登录页要求

登录页使用居中卡片布局。

包含：

- 系统名称
- 用户名输入框
- 密码输入框
- 记住我
- 登录按钮
- 基础表单校验

mock 登录规则：

- 用户名：admin
- 密码：admin123

登录成功后：

- 保存登录状态到 localStorage
- 跳转到 Dashboard 页面

退出登录后：

- 清除登录状态
- 跳转回登录页

## 六、后台主布局要求

后台主界面包含：

### Header

Header 包含：

- Sidebar 折叠按钮
- 面包屑
- 全局搜索静态入口
- 用户菜单
- 退出登录

### Sidebar

Sidebar 包含：

- 系统 Logo / 系统名称
- 静态菜单
- 菜单图标
- 当前菜单高亮
- 支持折叠

第一版菜单可以包含：

- Dashboard
- 用户管理
- 表单示例
- 系统设置

### Content

Content 区统一结构：

- PageHeader
- MainContent

页面内容区需要有统一内边距、背景色、卡片样式。

## 七、示例页面要求

### Dashboard 页面

展示：

- KPI 卡片
- 趋势图占位区域
- 最近操作列表
- 系统状态 / 待办信息

数据使用 mock 数据即可。

### 列表页示例

展示：

- PageHeader
- 搜索筛选区
- 表格
- 状态标签
- 操作按钮
- 分页
- 加载态 / 空态可以先做基础结构

数据使用 mock 数据即可。

### 表单页示例

展示：

- PageHeader
- 分组表单卡片
- 输入框
- 下拉选择
- 开关
- 文本域
- 提交按钮
- 重置按钮

第一版只做前端交互，不提交真实接口。

### 404 页面

展示基础 Not Found 页面，并提供返回首页按钮。

## 八、公共组件要求

优先抽取以下基础组件：

1. AppShell
2. AppHeader
3. AppSidebar
4. PageHeader
5. ContentCard
6. StatusTag
7. EmptyState
8. RequireAuth

可以根据实际需要再补充：

- SearchFilterBar
- DataTable
- FormSection
- UserMenu
- Breadcrumbs

但不要过度封装。

第一版目标是清晰、可维护、方便后续扩展。

## 九、样式和设计规范

请创建基础 design tokens 和全局样式。

要求：

- 颜色、圆角、间距、阴影、字体尽量通过 tokens 管理
- 不要在页面里随意写死大量颜色和间距
- 使用 4px 基准栅格
- 页面默认背景使用浅灰色
- 卡片使用白底、细边框、弱阴影
- 按钮、输入框、表格、卡片风格保持统一
- 字体优先使用系统字体
- 数字列可使用 tabular-nums

推荐视觉方向：

- 中性
- 专业
- 高密度
- 弱装饰
- 清晰分隔线
- 稳定阴影
- 低饱和主色

## 十、推荐项目结构

请尽量按以下结构组织项目：

src/
  app/
    App.tsx
    router.tsx
  components/
    layout/
      AppShell.tsx
      AppHeader.tsx
      AppSidebar.tsx
      PageHeader.tsx
    common/
      ContentCard.tsx
      StatusTag.tsx
      EmptyState.tsx
  features/
    auth/
      LoginPage.tsx
      authStore.ts
      RequireAuth.tsx
  pages/
    dashboard/
      DashboardPage.tsx
    examples/
      ListPage.tsx
      FormPage.tsx
    exception/
      NotFoundPage.tsx
  styles/
    tokens.css
    global.css
  lib/
    utils.ts
  main.tsx

如果 shadcn/ui 默认生成了自己的目录结构，可以合理兼容，但整体结构需要保持清晰。

## 十一、实现边界

第一版不要实现：

- 真实后端接口
- RBAC 权限系统
- 动态菜单接口
- 多标签页 Tabs
- 暗色模式
- 国际化
- 复杂表格配置器
- 复杂图表库
- 复杂主题编辑器
- 复杂移动端适配

第一版重点是：

- 能登录
- 能进入后台
- 有稳定布局
- 有基础路由
- 有示例页面
- 有统一风格
- 后续方便扩展

## 十二、编码要求

- 使用 TypeScript
- 组件命名清晰
- 目录结构清晰
- 避免过度设计
- 避免复制粘贴式页面结构
- 优先抽取真正高频复用的组件
- 每个组件职责单一
- 不要引入不必要依赖
- 修改完成后说明：
  1. 项目结构
  2. 主要实现文件
  3. 如何运行
  4. mock 登录账号
  5. 后续建议

## 十三、执行方式

请先不要直接大规模编码。

请先输出：

1. 你对需求的理解
2. 第一版实现范围
3. 推荐项目结构
4. 需要安装的依赖
5. 实现步骤

确认方案合理后，再开始创建和修改代码。