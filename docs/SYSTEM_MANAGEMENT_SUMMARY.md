# 系统基础管理页面实现总结

## 修改文件

- `src/pages/system-dicts.tsx`
- `src/pages/system-configs.tsx`
- `src/api/system.ts`
- `src/mocks/system.ts`
- `src/types/system.ts`
- `src/types/index.ts`
- `src/router.tsx`
- `src/config/navigation.ts`
- `src/components/layout/app-sidebar.tsx`

## 实现内容

### 字典管理

- 新增 `/system/dicts` 页面。
- 支持字典类型列表展示。
- 支持选中字典类型后展示对应字典项列表。
- 使用 `SearchFilterBar` 实现搜索筛选区。
- 使用 `DataTable` 展示字典类型和字典项。
- 使用 `StatusTag` 展示启用、停用状态。
- 提供静态新增、编辑、删除、查看项操作按钮。
- 提供分页占位。
- 数据通过 `src/api/system.ts` 获取，底层读取 `src/mocks/system.ts`。

### 配置管理

- 新增 `/system/configs` 页面。
- 展示系统配置项列表。
- 字段包含配置名称、配置键、配置值、配置类型、状态、更新时间、操作。
- 支持按关键词、配置类型、状态筛选。
- 使用 `SearchFilterBar`、`TableToolbar`、`DataTable`、`StatusTag`、`EmptyState`。
- 提供静态新增、编辑、删除按钮。
- 提供分页占位。
- 数据通过 `src/api/system.ts` 获取，底层读取 `src/mocks/system.ts`。

### 路由和菜单

- 路由新增：
  - `/system/dicts`
  - `/system/configs`
- Sidebar 静态菜单更新：
  - 在“系统设置”下增加“字典管理”和“配置管理”子菜单。
- 面包屑标题补充：
  - 字典管理
  - 配置管理

### 类型和 mock

- 字典相关类型集中在 `src/types/system.ts`。
- 配置相关类型集中在 `src/types/system.ts`。
- mock 数据集中在 `src/mocks/system.ts`。
- 页面不直接持有 mock 数据，统一通过 `src/api/system.ts` 获取。

## 验证结果

已执行：

```bash
npm run build
```

结果：构建通过，无异常。

## 未完成事项

- 未接真实后端。
- 新增、编辑、删除按钮为静态按钮，未实现弹窗表单。
- 未实现真实新增、编辑、删除接口。
- 分页为占位结构，未接真实分页参数。
- 未实现批量操作、排序和服务端筛选。
