# 任务 01：公共基础组件

## 目标

补齐接口对接后各业务模块都会用到的通用交互组件，避免每个页面重复实现分页、确认、反馈、树选择等能力。

## 参考文档

- `design-system/MASTER.md`
- `docs/BACKEND_INTEGRATION_CHECKLIST.md`
- `docs/frontend-api-guide.md`

## 负责范围

主要负责：

- `src/components/common/pagination.tsx`
- `src/components/common/toast.tsx`
- `src/components/common/confirm-dialog.tsx`
- `src/components/common/tree-select.tsx`
- `src/components/common/tree-check-list.tsx`
- 可选：小幅扩展 `src/components/common/data-table.tsx`

避免修改：

- 具体业务 API
- 具体业务页面，除非创建本地示例或编译验证
- 认证 store

## 实现要求

### Pagination

支持：

- `page`
- `pageSize`
- `total`
- `pageSizeOptions`
- `onPageChange`
- `onPageSizeChange`
- 上一页 / 下一页
- 总条数和当前页展示
- 禁用态

样式要求：

- 遵守后台系统高密度风格
- 不使用营销式大按钮或大留白
- 按钮尺寸与现有 `Button` 对齐

### Toast

支持：

- success
- error
- warning
- info
- 自动关闭
- 手动关闭

要求：

- 保持轻量，不引入大型 UI 框架
- 可通过 hook 或模块方法调用
- 文案区域不要挤压变形

### ConfirmDialog

支持：

- 标题
- 描述
- 确认按钮文本
- 取消按钮文本
- danger 模式
- loading 状态

用于：

- 删除
- 批量删除
- 重置密码
- 清空日志

### TreeSelect

用于单选树：

- 部门选择
- 父级菜单选择

支持：

- `id`
- `label`
- `children`
- 清空
- 禁用项

### TreeCheckList

用于多选树：

- 角色分配菜单

支持：

- 半选状态可后置
- 第一阶段至少支持父子层级展示和多选
- 支持回显 `checkedIds`

## 验收标准

- 新组件均使用 TypeScript
- 不引入新 UI 框架
- 不破坏现有公共组件 API
- 执行 `npm run build` 通过

## 注意事项

- 不要把请求状态管理塞进公共组件。
- `DataTable` 如果扩展 error，仅保留展示能力，不接管业务请求。
