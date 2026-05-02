# 后台管理组件使用经验

## 页面级组件

`PageHeader` 用于所有后台页面顶部。

适用场景：

- 页面标题
- 页面说明
- 新建、导入、返回等页面级主操作

不适合放：

- 复杂筛选条件
- 批量操作
- 和当前数据强相关的行级动作

`ContentCard` 用于承载独立内容区。

适用场景：

- 详情分组
- 树形面板
- 表单分区外壳
- 静态说明区

不适合：

- 大表格外再套多层卡片
- 页面整体再包一层大卡片

`SearchFilterBar` 用于列表页筛选。

适用场景：

- 关键词搜索
- 状态筛选
- 类型筛选
- 简单日期或组织筛选

使用原则：

- 筛选项靠近表格。
- 查询和重置按钮放在右侧。
- 高级筛选变多时再考虑折叠，不要一开始做复杂筛选框架。

`TableToolbar` 用于表格上方。

适用场景：

- 表格标题
- 当前总数说明
- 刷新按钮
- 批量删除、批量启停等表格级操作

不适合：

- 页面级新建主按钮，优先放 `PageHeader`
- 单行操作

`DataTable` 用于管理类列表。

适用场景：

- 用户、角色、菜单、字典、日志、配置等列表
- 需要 loading、empty、error 的表格
- 需要横向滚动的高密度数据

使用原则：

- 列定义放到模块内 `columns.tsx`。
- 操作列事件通过参数传入。
- 长文本截断，详情通过弹窗或详情页承载。
- 不把请求逻辑塞进 `DataTable`。

`StatusTag` 和 `ApiStatusTag` 用于状态展示。

适用场景：

- 启用/禁用
- 成功/失败
- 告警/处理中

使用原则：

- 后端 `1/0` 状态优先用 `ApiStatusTag`。
- 业务状态枚举可以在模块内定义映射，再用 `StatusTag` 展示。
- 不在页面中随意写新的状态颜色。

## 页面结构建议

普通列表页：

```text
PageHeader
SearchFilterBar
section
  TableToolbar
  DataTable
  Pagination
```

高级筛选列表页：

```text
PageHeader
SearchFilterBar
可选高级筛选区
section
  TableToolbar
  DataTable
  Pagination
```

表单新增/编辑页：

```text
PageHeader
form
  FormSection
  FormSection
  底部提交区
```

弹窗表单：

```text
FormDialog
  Field
  Input / Select / Switch / Textarea
```

详情页：

```text
PageHeader
摘要 ContentCard
基础信息 ContentCard
业务分组 ContentCard
```

左树右表页面：

```text
PageHeader
grid
  左侧 ContentCard + Tree
  右侧 SearchFilterBar + TableToolbar + DataTable + Pagination
```

字典类型 + 字典项页面：

```text
PageHeader
SearchFilterBar
grid
  字典类型 Table
  选中后显示字典项 Table
```

角色权限配置页面：

```text
PageHeader
SearchFilterBar
角色表格
RoleMenuDialog / TreeCheckList
```

用户管理页面：

```text
PageHeader
SearchFilterBar
用户表格
UserFormDialog
RoleAssignDialog
PasswordResultDialog
```

日志查询页面：

```text
PageHeader
SearchFilterBar
日志表格
DetailDialog
```

系统配置页面：

```text
PageHeader
SearchFilterBar
配置表格
ConfigFormDialog
ConfirmDialog
```

## 组件复用边界

应该保持通用的组件：

- `PageHeader`
- `ContentCard`
- `SearchFilterBar`
- `TableToolbar`
- `DataTable`
- `Pagination`
- `StatusTag`
- `ApiStatusTag`
- `ConfirmDialog`
- `FormDialog`
- `DetailDialog`
- `DetailItem`
- `Field`

可以做成业务组件的内容：

- 用户表单
- 角色菜单分配
- 菜单表单
- 字典类型表单
- 字典项表单
- 系统配置表单
- 日志详情弹窗

不应该塞进通用组件的逻辑：

- 具体 API 请求
- 业务字段转换
- 表单 schema
- 权限判断
- 后端枚举兼容
- 复杂联动规则

什么时候新建组件：

- 同一页面内 JSX 已经影响阅读。
- 同一模块内多个页面需要复用。
- 弹窗、表格列、表单字段组已经具备清晰职责。
- 组件 props 能保持稳定和简单。

什么时候保留页面内局部实现：

- 只使用一次。
- 逻辑非常贴近当前页面。
- 抽出后 props 会变得复杂。
- 还不确定未来是否复用。

## 后续开发建议

值得继续沉淀：

- 表单弹窗统一迁移到 `FormDialog`。
- 详情弹窗统一迁移到 `DetailDialog` 和 `DetailItem`。
- 后端 `1/0` 状态统一使用 `ApiStatusTag`。
- 列表请求可以沉淀请求序号或 AbortController 约定。
- 系统配置和字典缓存需要避免失败 Promise 长期缓存。

应该写入文档的规范：

- 页面目录结构。
- 列表页标准结构。
- 弹窗表单结构。
- 表格列拆分方式。
- 状态标签使用方式。
- 后端接口 TODO 记录方式。

暂时不需要过度设计：

- 通用 CRUD 页面生成器。
- 动态 schema 表单渲染器。
- 动态菜单和完整 RBAC。
- 表格列配置器。
- 全局请求缓存框架。

接真实后端前需要注意：

- 保持接口类型贴近后端字段。
- mock 字段不要混入真实业务类型。
- 401、字段错误、业务错误要统一处理。
- 批量接口和单项接口路径要严格按后端文档。
- 字典、配置等缓存要提供清理能力。
- 需要后端确认的问题统一写入 `docs/API_INTEGRATION_TODOS.md`。
