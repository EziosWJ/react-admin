# 任务 14：页面拆分公共基础提取

## 目标

为后续业务页面拆分准备低风险公共组件和工具函数，减少重复代码，但不引入复杂 CRUD 框架。

本任务只做公共基础能力，不迁移具体业务页面。

## 背景

当前多个页面重复存在：

- 表单弹窗壳：标题、关闭按钮、内容区、底部按钮、loading 状态
- 详情弹窗壳：遮罩、标题、关闭按钮、滚动内容区
- 详情字段展示：label/value 两段式
- 状态展示：`status: 1 | 0` 到启用/禁用标签
- 错误消息提取：`getErrorMessage(error, fallback)`

这些能力适合先提取为公共组件或工具，供后续模块拆分任务复用。

## 前置依赖

- 当前 `main` 分支代码
- `design-system/MASTER.md`

## 负责范围

主要负责新增：

- `src/components/common/form-dialog.tsx`
- `src/components/common/detail-dialog.tsx`
- `src/components/common/detail-item.tsx`
- `src/components/common/api-status-tag.tsx`
- `src/lib/error.ts`

可按需小幅修改：

- `src/types/api.ts`
- `src/types/index.ts`

避免修改：

- `src/pages/**`
- `src/router.tsx`
- `src/config/navigation.ts`
- 各业务 API 文件

## 实现要求

1. `FormDialog`
   - 只负责弹窗结构，不绑定 `react-hook-form`
   - 支持 `open`、`title`、`description`、`loading`、`submitText`、`cancelText`
   - 支持 `onCancel`、`onSubmit`
   - 支持 `children` 渲染表单内容
   - 使用 `createPortal`
   - 风格对齐现有后台弹窗

2. `DetailDialog`
   - 只负责详情弹窗外壳
   - 支持 `open`、`title`、`description`、`loading`、`onCancel`
   - 支持 `children`
   - 内容区需要支持滚动，避免内容超出视口

3. `DetailItem`
   - 支持 `label`、`value`、`className`
   - `value` 支持 `ReactNode`
   - 空值显示 `-`
   - 保持当前日志详情页视觉风格

4. `ApiStatusTag`
   - 输入 `status?: 1 | 0 | string | number | null`
   - 默认 `1=启用`、`0=禁用`
   - 支持自定义文案映射可选
   - 内部复用现有 `StatusTag`

5. `getErrorMessage`
   - 从页面中重复实现抽成 `src/lib/error.ts`
   - 逻辑保持当前行为：
     - `isApiError(error)` 返回 `error.message`
     - `error instanceof Error` 返回 `error.message`
     - 其他返回 fallback

## 暂不实现

- `CrudPage`
- `useCrudPage`
- `useTableRequest`
- schema 表单渲染器
- 动态列配置
- 请求缓存框架

## 验收标准

- 新增公共组件可被 TypeScript 正确引用
- 不改变任何现有页面行为
- 不引入新依赖
- 执行 `npm run build` 通过

## 注意事项

- 公共组件只做结构和展示，不接管业务请求。
- 不要为了减少少量代码而抽象复杂 props。
- 后续模块任务会逐步使用这些组件，本任务不强制替换现有页面。
