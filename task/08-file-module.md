# 任务 08：文件上传与文件管理

## 目标

封装后端文件上传、预览、下载 API，并为头像上传和后续文件管理页面提供基础能力。

## 参考文档

- `docs/frontend-api-guide.md` 的“文件管理”
- `docs/BACKEND_INTEGRATION_CHECKLIST.md`

## 前置依赖

- 任务 00：API 基础设施，必须支持 `FormData` 和 blob 下载
- 任务 01：公共基础组件中的 `Toast`、`ConfirmDialog`

## 负责范围

主要负责：

- `src/api/file.ts`
- `src/types/file.ts`
- `src/types/index.ts`
- 可选：`src/components/common/file-upload.tsx`
- 可选：`src/pages/system-files.tsx`
- 如新增页面，需要修改 `src/router.tsx` 和 `src/config/navigation.ts`

避免修改：

- 账号资料页头像保存逻辑，除非任务 11 已协调
- 用户管理页面

## 后端接口

- `POST /api/system/file/upload`
- `POST /api/system/file/upload-batch`
- `GET /api/system/file/page`
- `GET /api/system/file/{id}`
- `PUT /api/system/file/{id}`
- `DELETE /api/system/file/{id}`
- `DELETE /api/system/file/batch`
- `PATCH /api/system/file/{id}/status`
- `GET /api/system/file/{id}/download`
- `GET /api/system/file/{id}/view`

## 实现要求

1. 定义文件类型：
   - `id`
   - `originalName`
   - `storageName`
   - `extension`
   - `mimeType`
   - `fileSize`
   - `accessUrl`
   - `businessModule`
   - `remark`
   - `status`
   - `createTime`
2. API 方法：
   - 单文件上传
   - 批量文件上传
   - 文件分页
   - 文件详情
   - 修改文件信息
   - 删除
   - 批量删除
   - 启停
   - 下载 blob
3. 上传组件：
   - 支持选择文件
   - 支持上传 loading
   - 支持错误提示
   - 支持返回 `accessUrl`
4. 文件管理页面可选：
   - 如实现，使用通用列表结构
   - 支持下载、预览、删除、启停

## 验收标准

- 文件 API 可被账号头像上传复用
- 上传使用 `multipart/form-data`
- 下载可处理文件流
- 执行 `npm run build` 通过

## 注意事项

- `accessUrl` 可直接作为图片或预览 URL。
- 文件下载失败时后端可能返回 JSON 错误，HTTP 层需要配合区分。
