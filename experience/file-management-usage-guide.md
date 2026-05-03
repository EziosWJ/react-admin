# 文件管理使用经验

## 适用场景

当后续 agent 需要处理文件上传、文件管理页面、头像上传、业务附件字段、文件预览或文件下载时，优先参考本文档。

本文档用于说明文件能力如何在前端中使用，不替代具体实现任务。文件管理页面的执行任务见：

- `task/22-file-management-page.md`

后端接口来源：

- `docs/frontend-api-guide.md` 的“八、文件管理”和“11.4 文件上传”

## 当前前端基础

已有 API：

- `uploadFile(file, options)`
- `uploadFiles(files, options)`
- `getFilePage(query)`
- `getFileDetail(id)`
- `updateFile(id, data)`
- `deleteFile(id)`
- `batchDeleteFiles(data)`
- `updateFileStatus(id, data)`
- `downloadFile(id)`
- `getFileViewUrl(id)`

已有类型：

- `FileRecord`
- `FileUploadOptions`
- `FileListQuery`
- `FileUpdateRequest`
- `FileStatusRequest`
- `FileBatchDeleteRequest`

已有组件：

- `FileUpload`

`FileUpload` 适合表单内单文件上传，例如头像、封面图、业务附件入口。它不是完整文件管理页面，也不负责文件列表、预览、下载和删除。

## 推荐使用流程

### 1. 表单上传文件

典型流程：

```text
用户选择文件
调用 POST /api/system/file/upload
后端返回 FileRecord
取 FileRecord.accessUrl
把 accessUrl 写入业务表单字段
业务表单提交时保存 accessUrl
```

示例场景：

- 用户头像
- 文章封面
- 配置图片
- 简单附件 URL 字段

注意：

- 业务表单通常保存 `accessUrl`，不是保存完整 `FileRecord`。
- 如后端业务接口约定保存文件 ID，则按业务接口要求保存 `id`。
- 不要在业务页面直接拼接上传接口，优先复用 `uploadFile` 或 `FileUpload`。

### 2. 展示图片

如果字段保存的是 `accessUrl`，图片展示可直接使用：

```text
img src = accessUrl
```

如果只有文件 ID，可以使用：

```text
getFileViewUrl(id)
```

注意：

- 后端已确认预览接口 `GET /api/system/file/{id}/view` 免登录放行。
- 图片和 PDF 可以直接使用 `accessUrl` 或 `getFileViewUrl(id)` 预览。
- 预览免登录是临时方案，后续可能改为签名 URL；前端不要基于它设计额外公开分享能力。

### 3. 下载文件

下载必须走 blob。

推荐流程：

```text
调用 downloadFile(id)
拿到 Blob
创建 object URL
创建临时 a 标签触发 download
下载后释放 object URL
```

文件名策略：

- 后端已确认 `Content-Disposition` 使用 RFC 5987 `filename*=UTF-8''` 编码。
- 如果当前 HTTP 封装没有暴露响应头，先使用 `record.originalName`。
- 不要用 `storageName` 作为用户下载文件名，除非后端或业务明确要求。

### 4. 预览文件

第一版只建议支持浏览器原生可预览类型：

- `image/*`
- `application/pdf`

推荐展示方式：

- 图片使用 `img`
- PDF 使用 `iframe`

不建议第一版支持：

- Office 文档在线预览
- 视频播放器
- 音频播放器
- 压缩包内容预览
- 代码高亮预览

其他类型应提示用户下载。

### 5. 文件管理页面

文件管理页面负责维护文件元数据和文件状态。

它应该提供：

- 分页列表
- 筛选
- 上传
- 预览
- 下载
- 详情
- 编辑元信息
- 删除
- 批量删除
- 启用/禁用

它不应该负责：

- 业务附件关系维护
- 文件夹体系
- 文件权限模型
- 文件分享链接
- 分片上传
- 在线编辑

## 组件边界

### 应该保持通用

- `FileUpload`

适合在业务表单中复用。它只负责选择文件、上传文件、返回上传结果。

### 应该先放在文件管理模块内

- `FileUploadDialog`
- `FileDetailDialog`
- `FileEditDialog`
- `FilePreviewDialog`
- 文件大小格式化
- 文件类型是否可预览判断
- 文件下载触发逻辑

如果这些能力在多个模块中重复出现，再考虑上提到公共组件或 `src/lib`。

### 暂不抽象

- `FileManager`
- `FilePicker`
- `AttachmentList`
- `FilePreviewer`
- 通用批量上传框架
- 通用附件库

原因：

- 当前只有一个文件管理页面和少量表单上传场景。
- 复用边界还不稳定。
- 过早抽象会增加 props 复杂度和后续维护成本。

## 页面实现建议

文件管理列表页使用标准后台列表结构：

```text
PageHeader
SearchFilterBar
section
  TableToolbar
  DataTable
  Pagination
```

公共组件优先复用：

- `PageHeader`
- `SearchFilterBar`
- `TableToolbar`
- `DataTable`
- `Pagination`
- `ApiStatusTag`
- `ConfirmDialog`
- `FormDialog`
- `DetailDialog`
- `DetailItem`
- `EmptyState`

不要新增营销式卡片布局、瀑布流资源库或大图预览首页。

## 文件状态处理

后端通用状态：

- `1`：启用
- `0`：禁用

展示：

- 使用 `ApiStatusTag`

操作：

- 使用 `PATCH /api/system/file/{id}/status`
- 成功后刷新列表

待确认：

- 无。

已确认：

- `status=0` 的文件仍可预览和下载。
- 前端保持展示预览和下载操作按钮。

## 批量上传处理

后端提供：

- `POST /api/system/file/upload-batch`

第一版文件管理页面可以只做单文件上传。

如果实现批量上传：

- 使用 `uploadFiles(files, options)`
- 接口始终返回 200
- 响应 data 为 `{ succeeded, failed }`
- `succeeded` 为上传成功的 `FileRecord[]`
- `failed` 为 `{ fileName: string; message: string }[]`
- 需要遍历 `failed`，提示失败文件名和原因
- 存在部分成功时应刷新列表，并提示“部分上传成功”
- 后端已确认返回顺序与上传顺序一致

## 业务模块字段

上传接口支持：

- `businessModule`
- `remark`

建议：

- 头像：`user`
- 系统配置相关：`system-config`
- 通用后台上传：可留空

业务模块选项：

- 后端已提供 `GET /api/system/dict/FILE_BUSINESS_MODULE/items`
- 文件管理页面的 `businessModule` 筛选和上传弹窗应优先使用该字典
- 字典加载失败时可以降级为文本输入或空选项
- `mimeType` 无选项接口，继续使用文本输入筛选

## 错误处理

上传失败：

- 组件内展示错误提示
- 页面级操作可使用 toast

下载失败：

- 使用 toast 展示错误
- 如果后端返回 JSON 错误，HTTP 层应能识别

预览失败：

- 关闭预览或展示错误态
- 提供下载作为替代操作

删除失败：

- 保持弹窗打开或关闭后展示 toast 均可，但必须让用户知道失败原因

## 后续上提条件

只有满足以下条件时，才考虑把模块内能力上提为公共组件：

- 至少 3 个页面需要相同能力
- props 可以保持稳定
- 不是文件管理页面的专属业务行为
- 不需要引入新依赖
- 不会让简单上传场景变复杂

可能上提的能力：

- `formatFileSize`
- `isPreviewableFile`
- `downloadBlob`
- 轻量 `FilePreviewDialog`

暂不建议上提：

- 完整文件管理页面
- 带业务选择能力的文件选择器
- 附件关系维护组件
