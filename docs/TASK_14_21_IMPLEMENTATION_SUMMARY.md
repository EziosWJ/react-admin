# Task 14-21 实施总结

## 完成情况

本次已完成 `task` 目录中编号 14 到 21 的任务。

| 任务 | 状态 | 说明 |
| --- | --- | --- |
| 14 | 已完成 | 新增表单弹窗、详情弹窗、详情字段、API 状态标签和错误消息工具。 |
| 15 | 已完成 | 用户管理拆分到 `src/pages/system/users/`，旧入口保留兼容导出。 |
| 16 | 已完成 | 字典管理拆分到 `src/pages/system/dicts/`，旧入口保留兼容导出。 |
| 17 | 已完成 | 角色管理拆分到 `src/pages/system/roles/`，旧入口保留兼容导出。 |
| 18 | 已完成 | 菜单管理拆分到 `src/pages/system/menus/`，旧入口保留兼容导出。 |
| 19 | 已完成 | 部门和日志页面拆分到 `src/pages/system/depts/`、`src/pages/system/logs/`。 |
| 20 | 已完成 | `src/router.tsx` 已改为从新目录导入页面。 |
| 21 | 已完成 | 系统配置页面迁移到真实接口，并迁入 `src/pages/system/configs/`。 |

## 修改文件

主要新增和修改范围：

- `src/components/common/*`
- `src/lib/error.ts`
- `src/api/system.ts`
- `src/types/system.ts`
- `src/types/index.ts`
- `src/pages/system/**`
- `src/pages/examples/**`
- `src/router.tsx`
- `src/config/navigation.ts`
- `src/pages/*` 中旧页面兼容导出文件
- `docs/TASK_14_21_IMPLEMENTATION_SUMMARY.md`
- `experience/component-usage-guide.md`

## 新增组件

- `FormDialog`：表单弹窗结构壳，不绑定具体表单库。
- `DetailDialog`：详情弹窗结构壳，支持滚动内容区。
- `DetailItem`：统一详情 label/value 展示。
- `ApiStatusTag`：封装 `1/0` 启禁用状态展示。
- `toast-store` / `use-toast`：拆分 toast 的非组件导出，清理 Fast Refresh warning。
- `getErrorMessage`：统一从 API error、Error 和 fallback 中提取错误文案。

## 新增页面

新增后台常见 Demo 页面：

- `/examples/list`：列表页 Demo
- `/examples/tree`：树形结构 Demo
- `/examples/tree-table`：左树右表 Demo
- `/examples/detail`：详情页 Demo

已有表单 Demo 保留在：

- `/forms/basic`

## 新增或调整类型与 API

系统配置模块新增真实后端类型：

- `SystemConfigType`
- `SystemConfigValueType`
- `SystemConfigRecord`
- `SystemConfigValueRecord`
- `SystemConfigListQuery`
- `SystemConfigCreateRequest`
- `SystemConfigUpdateRequest`
- `SystemConfigStatusRequest`
- `SystemConfigBatchDeleteRequest`

系统配置 API 已迁移为真实接口：

- `getSystemConfigPage`
- `getSystemConfigDetail`
- `getSystemConfigByKey`
- `createSystemConfig`
- `updateSystemConfig`
- `deleteSystemConfig`
- `batchDeleteSystemConfigs`
- `updateSystemConfigStatus`
- `clearSystemConfigCache`

## 已完成的重构与优化

- 大型页面从 `src/pages/*.tsx` 拆分到 `src/pages/system/<module>/`。
- `router.tsx` 导入路径改为新目录。
- 系统配置模块移除 mock-only 页面状态，接入真实 API。
- 新增 Demo 页面用于后续页面开发参考。
- 拆分 toast 非组件导出，`npm run lint` 不再出现 Fast Refresh warning。
- 公共弹窗和详情展示组件已沉淀，后续页面可以逐步迁移使用。

## Review 发现的问题

本次 Review 发现并已处理：

- `router.tsx` 仍导入旧页面路径：已改为新目录导入。
- `system-configs` 路径和真实页面状态不一致：已迁移到 `src/pages/system/configs/` 并保留旧入口兼容导出。
- `toast.tsx` Fast Refresh warning：已拆分为 `toast-store.ts` 和 `use-toast.ts`。

仍建议后续处理：

- 权限守卫当前仍基于 mock 权限点，未来应改为当前用户权限或后端权限接口。
- 多个列表页请求缺少请求取消或请求序号保护，快速筛选可能出现旧响应覆盖新数据。
- `UserRecord` 仍兼容旧 mock 字段，后续可在 mock 清理时收紧真实类型。
- 页面弹窗虽然已拆出公共组件，但旧业务页还没有全面迁移到 `FormDialog` / `DetailDialog`。
- 字典和系统配置缓存当前以 Promise 缓存为主，失败 Promise 的恢复策略后续可继续加强。

## 暂未处理事项

- 未删除旧页面兼容导出文件，例如 `src/pages/users.tsx`、`src/pages/system-dicts.tsx`。
- 未清理 `src/mocks/rbac.ts` 中的旧 `componentPath` 字符串。
- 未接入真实后端做浏览器联调。
- 未引入路由懒加载，当前构建仍有 chunk size warning。

## 组件使用经验

详细经验已输出到：

- `experience/component-usage-guide.md`

核心原则：

- 页面入口负责状态和请求调度。
- 表格列、schema、弹窗组件按模块拆分。
- 公共组件只负责结构和展示，不接管业务请求。
- 业务差异明显时保留模块内组件，不提前抽成复杂 CRUD 框架。

## Demo 页面说明

列表页 Demo 展示：

- `PageHeader`
- `SearchFilterBar`
- `TableToolbar`
- `DataTable`
- `StatusTag`
- `Pagination`

树形结构 Demo 展示：

- 左侧树节点展开/选中
- 右侧详情联动
- 树形数据适用于部门、菜单、分类等场景

左树右表 Demo 展示：

- 左侧组织分类
- 右侧查询区、工具栏、表格、分页
- 适用于用户管理、分类商品、组织资源等页面

详情页 Demo 展示：

- 顶部摘要
- 状态和主操作
- 基础信息区
- 分组信息区

## 验证结果

已执行：

```bash
npm run build
npm run lint
```

结果：

- `npm run build` 通过。
- `npm run lint` 通过。
- Vite 仍提示 chunk 超过 500 kB，这是体积提示，不是构建错误。
