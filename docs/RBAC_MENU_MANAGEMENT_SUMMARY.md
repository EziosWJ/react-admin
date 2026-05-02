# RBAC 菜单管理页面总结

## 修改文件

- `src/pages/system-menus.tsx`
- `src/api/rbac.ts`
- `src/mocks/rbac.ts`
- `src/types/rbac.ts`
- `src/types/index.ts`
- `src/router.tsx`
- `src/config/navigation.ts`

## 实现内容

### 菜单管理页面

- 新增 `/system/menus` 页面。
- 菜单位置接入到“系统设置 / 菜单管理”。
- 使用 mock 数据展示树形菜单结构。
- 页面字段包含：
  - 菜单名称
  - 菜单类型
  - 路由路径
  - 组件路径
  - 权限标识
  - 图标
  - 排序
  - 状态
  - 更新时间
  - 操作
- 菜单类型包含：
  - 目录
  - 菜单
  - 按钮
- 复用现有：
  - `PageHeader`
  - `SearchFilterBar`
  - `TableToolbar`
  - `DataTable`
  - `StatusTag`
  - `EmptyState`
- 提供静态按钮：
  - 新增
  - 编辑
  - 新增子菜单
  - 删除
- 暂未实现弹窗表单、拖拽排序和真实权限控制。

### 数据层

- 新增 `src/types/rbac.ts` 中的菜单类型定义。
- 扩展 `src/mocks/rbac.ts`，增加菜单 mock 数据和过滤逻辑。
- 扩展 `src/api/rbac.ts`，增加菜单查询 API 和总数方法。

### 路由和菜单

- 路由新增 `/system/menus`。
- `Sidebar` 的“系统设置”分组下新增“菜单管理”。
- 面包屑标题补充“菜单管理”。

## 验证结果

已执行：

```bash
npm run build
```

结果：构建通过，无异常。

## 未完成事项

- 未接真实后端。
- 未实现真实弹窗表单。
- 未实现拖拽排序。
- 未实现真实权限控制。
- 未引入复杂树表格库。
