# 任务 18：菜单管理页面拆分

## 目标

将 `src/pages/system-menus.tsx` 拆分为菜单管理模块目录，降低菜单表单、表格列和树形数据处理混在单文件中的复杂度。

## 前置依赖

- 任务 14：页面拆分公共基础提取

如果任务 14 尚未合并，本任务可以先保留当前局部弹窗实现。

## 负责范围

主要负责：

- `src/pages/system-menus.tsx`
- `src/pages/system/menus/index.tsx`
- `src/pages/system/menus/columns.tsx`
- `src/pages/system/menus/schema.ts`
- `src/pages/system/menus/menu-form-dialog.tsx`

可按需新增：

- `src/pages/system/menus/utils.ts`

避免修改：

- `src/router.tsx`
- `src/api/rbac.ts`
- `src/types/rbac.ts`
- 角色管理页面
- 侧边栏导航组件

## 拆分方式

1. 新建 `src/pages/system/menus/`。
2. 将原 `SystemMenusPage` 主页面迁移到 `index.tsx`。
3. 保留 `src/pages/system-menus.tsx`，改为兼容导出：

```ts
export { SystemMenusPage } from "@/pages/system/menus";
```

## 建议文件职责

- `index.tsx`
  - 页面状态
  - 菜单列表请求
  - 新增、编辑、删除、启停调度
  - 页面布局

- `columns.tsx`
  - 菜单表格列
  - 操作列事件通过参数传入

- `schema.ts`
  - 菜单表单 schema
  - 表单默认值转换
  - 菜单 payload 构造
  - 查询参数构造
  - 树形菜单辅助函数

- `menu-form-dialog.tsx`
  - 菜单新增/编辑表单弹窗

## 实现要求

- 拆分后行为保持一致
- 不调整菜单 API
- 不调整路由和侧边栏导航
- 不引入动态菜单能力
- 不引入新依赖

## 验收标准

- `/system/menu` 和 `/system/menus` 均可正常访问菜单管理
- 菜单新增、编辑、删除、启停行为不变
- `src/pages/system-menus.tsx` 只保留兼容导出
- 执行 `npm run build` 通过
- 执行 `npm run lint` 无新增 error

## 注意事项

- 本任务不要修改 `src/config/navigation.ts`。
- 本任务不要改角色分配菜单逻辑。
