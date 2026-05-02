# 任务 06：字典管理模块

## 目标

将字典管理迁移到真实后端接口，并提供前端常用字典项查询与缓存能力。

## 参考文档

- `docs/frontend-api-guide.md` 的“字典管理”
- `docs/BACKEND_INTEGRATION_CHECKLIST.md`

## 前置依赖

- 任务 00：API 基础设施
- 任务 01：公共基础组件中的 `Pagination`、`ConfirmDialog`、`Toast`

## 负责范围

主要负责：

- `src/api/system.ts` 中字典相关方法，或新增 `src/api/dict.ts`
- `src/types/system.ts` 中字典相关类型
- `src/types/index.ts`
- `src/pages/system-dicts.tsx`
- 可选：`src/store/dict-store.ts`

避免修改：

- 用户管理页面
- 角色管理页面
- 菜单管理页面

## 后端接口

字典类型：

- `GET /api/system/dict-type/page`
- `GET /api/system/dict-type/{id}`
- `POST /api/system/dict-type`
- `PUT /api/system/dict-type/{id}`
- `DELETE /api/system/dict-type/{id}`
- `DELETE /api/system/dict-type/batch`
- `PATCH /api/system/dict-type/{id}/status`

字典数据：

- `GET /api/system/dict-data/page`
- `GET /api/system/dict-data/{id}`
- `POST /api/system/dict-data`
- `PUT /api/system/dict-data/{id}`
- `DELETE /api/system/dict-data/{id}`
- `DELETE /api/system/dict-data/batch`

常用字典项：

- `GET /api/system/dict/{dictCode}/items`

## 实现要求

1. 字典类型字段对齐后端：
   - `dictName`
   - `dictCode`
   - `status: 1 | 0`
   - `sortOrder`
   - `isBuiltin`
   - `remark`
   - `createTime`
2. 字典数据字段对齐后端：
   - `dictTypeId`
   - `dictLabel`
   - `dictValue`
   - `sortOrder`
   - `remark`
   - `createTime`
3. 字典类型列表：
   - 真实分页
   - 按 `dictName`、`dictCode`、`status` 查询
   - 新增、编辑、删除、启停
4. 字典数据列表：
   - 使用 `dictTypeId` 查询，不再使用当前 mock 的 `typeCode`
   - 新增、编辑、删除
5. 内置字典保护：
   - `isBuiltin=1` 禁止删除
   - `isBuiltin=1` 禁止修改 `dictCode`
6. 通用字典项缓存：
   - 按 `dictCode` 请求
   - 返回 `{ label, value, sortOrder }[]`
   - 支持页面按需读取
   - 第一阶段可使用简单内存缓存或 Zustand

## 验收标准

- 字典页面不再读取 mock
- 字典数据查询依赖 `dictTypeId`
- 常用字典项查询方法可供其他模块复用
- 内置字典限制生效
- 执行 `npm run build` 通过
