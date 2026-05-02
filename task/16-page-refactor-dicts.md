# 任务 16：字典管理页面拆分

## 目标

将 `src/pages/system-dicts.tsx` 拆分为字典管理模块目录，降低 1000 行以上单文件的维护成本。

## 前置依赖

- 任务 14：页面拆分公共基础提取

如果任务 14 尚未合并，本任务可以先保留必要局部组件。

## 负责范围

主要负责：

- `src/pages/system-dicts.tsx`
- `src/pages/system/dicts/index.tsx`
- `src/pages/system/dicts/columns.tsx`
- `src/pages/system/dicts/schema.ts`
- `src/pages/system/dicts/dict-type-form-dialog.tsx`
- `src/pages/system/dicts/dict-data-form-dialog.tsx`

可按需新增：

- `src/pages/system/dicts/utils.ts`

避免修改：

- `src/router.tsx`
- `src/api/system.ts`
- `src/types/system.ts`
- 用户、角色、菜单、部门页面

## 拆分方式

1. 新建 `src/pages/system/dicts/`。
2. 将原 `SystemDictsPage` 主页面迁移到 `index.tsx`。
3. 保留 `src/pages/system-dicts.tsx`，改为兼容导出：

```ts
export { SystemDictsPage } from "@/pages/system/dicts";
```

## 建议文件职责

- `index.tsx`
  - 字典类型和字典项的页面主状态
  - 数据加载
  - 搜索、表格、分页、右侧字典项面板布局

- `columns.tsx`
  - 字典类型列
  - 字典项列
  - 操作事件通过参数传入

- `schema.ts`
  - 字典类型表单 schema
  - 字典项表单 schema
  - `toTypeFormValues`
  - `toDataFormValues`
  - `buildTypePayload`
  - `buildDataPayload`
  - 查询参数构造函数

- `dict-type-form-dialog.tsx`
  - 字典类型新增/编辑弹窗

- `dict-data-form-dialog.tsx`
  - 字典项新增/编辑弹窗

## 实现要求

- 保持当前交互不变：
  - 初始只显示字典类型列表
  - 点行或“查看项”打开右侧字典项面板
  - 右侧面板可收起
- 不改变字典 API 请求
- 不改变表单校验规则
- 不改变内置字典限制
- 不引入新依赖

## 验收标准

- `/system/dict` 和 `/system/dicts` 均可正常访问字典管理
- 字典类型和字典项 CRUD 行为不变
- `src/pages/system-dicts.tsx` 只保留兼容导出
- 执行 `npm run build` 通过
- 执行 `npm run lint` 无新增 error

## 注意事项

- 本任务不要抽象通用左右分栏 CRUD 框架。
- 本任务不要修改其他系统管理页面。
