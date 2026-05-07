# 后台管理组件使用经验

## 页面级组件

| 组件 | 用途 | 不适合 |
|------|------|--------|
| `PageHeader` | 标题、说明、新建/导入/返回等主操作 | 复杂筛选、批量操作、行级动作 |
| `ContentCard` | 详情分组、树形面板、表单分区、静态说明 | 大表格外再套多层卡片 |
| `SearchFilterBar` | 列表页筛选（关键词、状态、类型、日期） | 高级筛选过多时再考虑折叠 |
| `TableToolbar` | 表格标题、总数、刷新、批量操作 | 页面级主按钮（放 PageHeader） |
| `DataTable` | 管理类列表，带 loading/empty/error | 不塞请求逻辑 |
| `StatusTag` / `ApiStatusTag` | 启用/禁用、成功/失败状态 | 不随意写新状态颜色 |

## 页面结构模板

列表页：
```
PageHeader → SearchFilterBar → section(TableToolbar + DataTable + Pagination)
```

表单新增/编辑页：
```
PageHeader → form(FormSection + 底部提交区)
```

弹窗表单：`FormDialog(Input/Select/Switch/Textarea)`

详情页：`PageHeader → ContentCard(摘要/基础信息/业务分组)`

左树右表：`PageHeader → grid(左 ContentCard+Tree, 右 SearchFilterBar+Table+Pagination)`

字典类型+字典项：`PageHeader → SearchFilterBar → grid(字典类型 Table, 字典项 Table)`

用户管理：`PageHeader → SearchFilterBar → 表格 + UserFormDialog + RoleAssignDialog + PasswordResultDialog`

日志查询：`PageHeader → SearchFilterBar → 表格 + DetailDialog`

系统配置：`PageHeader → SearchFilterBar → 表格 + ConfigFormDialog + ConfirmDialog`

## 复用边界

保持通用：`PageHeader`、`ContentCard`、`SearchFilterBar`、`TableToolbar`、`DataTable`、`Pagination`、`StatusTag`、`ApiStatusTag`、`ConfirmDialog`、`FormDialog`、`DetailDialog`、`DetailItem`、`Field`

可做业务组件：用户表单、角色菜单分配、菜单表单、字典类型/项表单、系统配置表单、日志详情弹窗

不塞入通用组件：API 请求、业务字段转换、表单 schema、权限判断、后端枚举兼容、复杂联动

## 何时新建组件

- 同一页面 JSX 已影响阅读
- 同模块多页面需复用
- 弹窗/表格列/表单字段组职责清晰
- props 能保持稳定简单

否则保留页面内局部实现。

## 后续开发建议

值得沉淀：弹窗统一 FormDialog、详情统一 DetailDialog、1/0 状态统一 ApiStatusTag、请求序号/AbortController 约定、缓存清理能力

暂不过度设计：通用 CRUD 生成器、动态 schema 表单、动态菜单 RBAC、表格列配置器、全局请求缓存框架

接真实后端注意：类型贴近后端字段、mock 不混入真实类型、401/字段错误/业务错误统一处理、批量接口路径严格按文档、缓存提供清理、问题统一写 `docs/API_INTEGRATION_TODOS-{date}.md`
