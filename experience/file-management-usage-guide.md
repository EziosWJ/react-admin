# 文件管理使用经验

## 适用场景

处理文件上传、文件管理页面、头像上传、业务附件、文件预览/下载时参考。页面任务见 `task/22-file-management-page.md`。接口来源：`docs/frontend-api-guide.md` 的"八、文件管理"和"11.4 文件上传"。

## 当前基础

API：`uploadFile`、`uploadFiles`、`getFilePage`、`getFileDetail`、`updateFile`、`deleteFile`、`batchDeleteFiles`、`updateFileStatus`、`downloadFile`、`getFileViewUrl`

类型：`FileRecord`、`FileUploadOptions`、`FileListQuery`、`FileUpdateRequest`、`FileStatusRequest`、`FileBatchDeleteRequest`

组件：`FileUpload`（表单内单文件上传，不负责列表/预览/下载/删除）

## 使用流程

### 上传

用户选文件 → `POST /api/system/file/upload` → 拿 `FileRecord.accessUrl` → 写入业务表单字段 → 提交时保存 `accessUrl`（或按业务接口保存 `id`）

复用 `uploadFile` 或 `FileUpload`，不在业务页面直接拼上传接口。

### 展示

- 有 `accessUrl`：`<img src={accessUrl}>`
- 只有文件 ID：`getFileViewUrl(id)`
- 预览接口 `GET /api/system/file/{id}/view` 免登录（临时方案，后续可能改签名 URL）

### 下载

`downloadFile(id)` → 拿 Blob → 创建 object URL → 临时 `<a>` 触发下载 → 释放 URL

文件名用 `record.originalName`，不用 `storageName`。后端 `Content-Disposition` 使用 RFC 5987 编码。

### 预览

第一版只支持浏览器原生预览：`image/*` 用 `<img>`、`application/pdf` 用 `<iframe>`。其他类型提示下载。

不建议第一版支持：Office 在线预览、视频播放器、音频播放器、压缩包预览、代码高亮。

## 文件管理页面

职责：分页列表、筛选、上传、预览、下载、详情、编辑元信息、删除、批量删除、启停。

不负责：业务附件关系、文件夹体系、文件权限、分享链接、分片上传、在线编辑。

## 组件边界

保持通用：`FileUpload`

模块内：`FileUploadDialog`、`FileDetailDialog`、`FileEditDialog`、`FilePreviewDialog`、文件大小格式化、可预览判断、下载触发。多模块重复时再上提。

暂不抽象：`FileManager`、`FilePicker`、`AttachmentList`、`FilePreviewer`、通用批量上传框架。

## 页面结构

```
PageHeader → SearchFilterBar → section(TableToolbar + DataTable + Pagination)
```

复用：`PageHeader`、`SearchFilterBar`、`TableToolbar`、`DataTable`、`Pagination`、`ApiStatusTag`、`ConfirmDialog`、`FormDialog`、`DetailDialog`、`DetailItem`、`EmptyState`。

不做卡片布局、瀑布流、大图预览首页。

## 文件状态

`1`=启用、`0`=禁用，展示用 `ApiStatusTag`，操作用 `PATCH /api/system/file/{id}/status`。`status=0` 仍可预览和下载，前端保持展示操作按钮。

## 批量上传

接口：`POST /api/system/file/upload-batch`

- `uploadFiles(files, options)` 始终返回 200
- `data = { succeeded: FileRecord[], failed: { fileName, message }[] }`
- 遍历 `failed` 提示失败原因，部分成功时刷新列表并提示
- 返回顺序与上传顺序一致
- 第一版可只做单文件上传

## 业务模块字段

上传支持 `businessModule`、`remark`。建议值：头像=`user`、系统配置=`system-config`、通用=留空。

`businessModule` 选项用 `GET /api/system/dict/FILE_BUSINESS_MODULE/items`，失败时降级文本输入。`mimeType` 无选项接口，继续文本输入。

## 错误处理

- 上传失败：组件内展示错误
- 下载失败：toast 展示
- 预览失败：关闭预览或展示错误态，提供下载替代
- 删除失败：保持弹窗或关闭后 toast，必须让用户知道原因

## 上提条件

至少 3 个页面需相同能力、props 稳定、非文件管理专属、不引入新依赖、不增加简单场景复杂度。

可能上提：`formatFileSize`、`isPreviewableFile`、`downloadBlob`、轻量 `FilePreviewDialog`。

暂不上提：完整文件管理页面、带业务选择的文件选择器、附件关系维护组件。
