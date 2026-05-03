# 任务 22：文件管理页面

## 目标

根据 `docs/frontend-api-guide.md` 中的文件管理接口，补齐后台文件管理页面，支持文件分页、筛选、上传、预览、下载、详情、编辑、删除、批量删除和启用/禁用。

本任务重点是文件管理模块页面，不重新设计文件上传基础设施，也不引入复杂附件管理体系。

## 参考文档

- `docs/frontend-api-guide.md` 的“八、文件管理”和“11.4 文件上传”
- `docs/API_INTEGRATION_FEEDBACK.md` 的第 9、10 条
- `docs/API_INTEGRATION_TODOS.md`
- `design-system/MASTER.md`
- `experience/component-usage-guide.md`
- `experience/file-management-usage-guide.md`
- `task/08-file-module.md`

## 前置依赖

- 任务 00：API 基础设施
- 任务 01：公共基础组件
- 任务 14：页面拆分公共基础提取
- `src/api/file.ts` 已提供文件 API 封装
- `src/types/file.ts` 已提供文件类型
- `src/components/common/file-upload.tsx` 已提供基础单文件上传组件

## 负责范围

主要负责新增：

- `src/pages/system/files/index.tsx`
- `src/pages/system/files/columns.tsx`
- `src/pages/system/files/file-upload-dialog.tsx`
- `src/pages/system/files/file-detail-dialog.tsx`
- `src/pages/system/files/file-edit-dialog.tsx`
- `src/pages/system/files/file-preview-dialog.tsx`
- `src/pages/system/files/utils.ts`
- `src/pages/system-files.tsx`

需要小幅修改：

- `src/router.tsx`
- `src/config/navigation.ts`
- `src/types/index.ts`，如当前未导出文件类型

可按需小幅修改：

- `src/api/file.ts`
- `src/types/file.ts`
- `src/components/common/file-upload.tsx`

避免修改：

- 用户管理页面
- 账号资料页头像保存逻辑
- 认证逻辑
- `src/components/common/data-table.tsx`，除非明确只做低风险行选择扩展
- 系统配置、字典、角色、菜单、部门、日志页面

## 后端接口

- `POST /api/system/file/upload`
- `POST /api/system/file/upload-batch`
- `GET /api/system/file/page`
- `GET /api/system/file/{id}`
- `PUT /api/system/file/{id}`
- `DELETE /api/system/file/{id}`
- `POST /api/system/file/batch-delete`
- `PATCH /api/system/file/{id}/status`
- `GET /api/system/file/{id}/download`
- `GET /api/system/file/{id}/view`

## 类型设计

优先复用 `src/types/file.ts` 中已有类型：

```ts
export type FileRecord = {
  id: number;
  originalName: string;
  storageName: string;
  extension: string;
  mimeType: string;
  fileSize: number;
  accessUrl: string;
  businessModule?: string | null;
  remark?: string | null;
  status: ApiStatus;
  createTime: string;
};
```

如实现时发现缺少类型，只在 `src/types/file.ts` 中补齐：

- `FileUploadOptions`
- `FileUploadBatchResult`
- `FileUploadFailedItem`
- `FileListQuery`
- `FileUpdateRequest`
- `FileStatusRequest`
- `FileBatchDeleteRequest`

不要为了页面需求新增和后端协议不一致的文件字段。

## API 实现要求

优先复用 `src/api/file.ts` 中已有方法：

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

实现时需要检查：

- 批量删除接口必须使用 `POST /api/system/file/batch-delete`
- 上传接口必须使用 `multipart/form-data`
- 批量上传接口返回 `{ succeeded: FileRecord[]; failed: { fileName: string; message: string }[] }`
- 下载接口必须使用 blob 方式处理
- 预览 URL 使用 `accessUrl` 或 `getFileViewUrl(id)`
- `status=all` 不应作为真实查询参数提交给后端

## 页面实现要求

### 1. 路由与导航

新增路由：

- `/system/file`
- `/system/files`，作为兼容路径，可选

导航位置：

- 放在 `系统管理` 下
- 菜单名称：`文件管理`
- 图标优先使用 `Files` 或 `FolderOpen`

旧入口兼容导出：

```ts
export { SystemFilesPage } from "@/pages/system/files";
```

### 2. 页面结构

页面类型为列表页，结构遵循：

```text
PageHeader
SearchFilterBar
section
  TableToolbar
  DataTable
  Pagination
FileUploadDialog
FileDetailDialog
FileEditDialog
FilePreviewDialog
ConfirmDialog
```

`PageHeader`：

- 标题：`文件管理`
- 说明：简短说明文件元数据维护、上传、预览和下载
- 主操作：`上传文件`

`SearchFilterBar`：

- 文件名：`originalName`
- 业务模块：`businessModule`
- MIME 类型：`mimeType`
- 状态：`status`

`TableToolbar`：

- 展示总数
- 刷新
- 批量删除

### 3. 列表查询

查询参数：

- `page`
- `pageSize`
- `originalName`
- `businessModule`
- `mimeType`
- `status`

要求：

- 查询前 trim 文本输入
- 空字符串不提交
- `status=all` 不提交
- 查询后回到第 1 页
- 重置后清空筛选并回到第 1 页
- 加载失败时清空列表并显示错误态

### 4. 表格字段

建议列：

- 文件名：展示 `originalName`，下方展示 `storageName` 或 `ID`
- 扩展名：`extension`
- MIME 类型：`mimeType`
- 文件大小：`fileSize`，格式化为 `B`、`KB`、`MB`
- 业务模块：`businessModule`
- 状态：`status`，使用 `ApiStatusTag`
- 备注：`remark`，长文本截断
- 创建时间：`createTime`
- 操作：预览、下载、详情、编辑、启用/禁用、删除

交互要求：

- 图片和 PDF 等可预览文件展示 `预览` 操作
- 不适合浏览器预览的类型，预览按钮禁用或不展示
- 下载操作必须有 loading 或防重复点击处理
- 删除前必须二次确认
- 启用/禁用成功后刷新列表

### 5. 上传弹窗

`FileUploadDialog` 负责页面级上传，不替代 `FileUpload` 的通用表单上传能力。

字段：

- 文件：必填
- 业务模块：可选，优先通过 `GET /api/system/dict/FILE_BUSINESS_MODULE/items` 获取选项
- 备注：可选

要求：

- 第一版可以只支持单文件上传
- 如果实现批量上传，使用 `uploadFiles`
- 如果实现批量上传，必须遍历 `failed` 数组提示失败文件名和原因
- 如果批量上传存在 `succeeded` 且存在 `failed`，应提示“部分上传成功”并刷新列表
- 上传成功后关闭弹窗、刷新列表、显示成功提示
- 上传失败展示错误提示
- 不引入拖拽上传、断点续传、分片上传

### 6. 详情弹窗

`FileDetailDialog` 使用 `DetailDialog` 和 `DetailItem`。

展示字段：

- ID
- 原始文件名
- 存储文件名
- 扩展名
- MIME 类型
- 文件大小
- 访问地址
- 业务模块
- 状态
- 备注
- 创建时间

详情打开时可先使用当前行数据，再调用 `getFileDetail(id)` 刷新完整数据。

### 7. 编辑弹窗

`FileEditDialog` 只允许编辑文件元信息：

- `businessModule`
- `remark`

不允许修改：

- 文件名
- 存储名
- 扩展名
- MIME 类型
- 文件大小
- 访问地址
- 文件内容

保存使用：

- `PUT /api/system/file/{id}`

保存成功后关闭弹窗并刷新列表。

### 8. 预览弹窗

`FilePreviewDialog` 只处理浏览器可直接预览的类型。

建议规则：

- `image/*`：使用 `img`
- `application/pdf`：使用 `iframe`
- 其他类型：不打开预览，提示使用下载

注意：

- 后端已确认 `GET /api/system/file/{id}/view` 预览接口免登录放行，图片和 PDF 可以直接使用 `accessUrl` 或 `getFileViewUrl(id)` 作为 `img` / `iframe` 地址。
- 下载接口仍需登录，不能直接用普通链接绕过 `downloadFile(id)`。
- 预览免登录是后端临时方案，后续可能改为签名 URL；前端不要额外假设永久公开访问。

### 9. 下载处理

下载使用 `downloadFile(id)` 获取 blob。

要求：

- 触发浏览器下载
- 后端已确认 `Content-Disposition` 使用 RFC 5987 `filename*=UTF-8''` 编码
- 当前 `http.blob` 没有暴露响应头时，先使用 `record.originalName` 作为下载文件名
- 下载失败时展示错误提示
- 生成的 object URL 下载后要释放

如多个模块后续都需要下载 blob，再考虑沉淀 `downloadBlob` 工具。本任务可先放在 `src/pages/system/files/utils.ts`。

### 10. 批量删除

第一版允许在文件管理页面内部实现选中状态。

要求：

- 只有选中记录后才允许批量删除
- 批量删除前二次确认
- 请求体为 `{ ids: number[] }`
- 成功后刷新列表
- 如果当前页记录全部删除，页码应回退或重新加载有效页

不要求本任务改造 `DataTable` 为通用行选择表格。只有当实现时确认改造很小且不影响现有页面，才可以给 `DataTable` 增加可选 `rowSelection`。

## 组件与文档边界

本任务应新增模块内组件，不新增大而全通用组件。

建议模块内组件：

- `FileUploadDialog`
- `FileDetailDialog`
- `FileEditDialog`
- `FilePreviewDialog`

暂不新增通用组件：

- `FileManager`
- `FilePicker`
- `AttachmentList`
- `FilePreviewer`
- 通用批量上传框架
- 通用附件库

已有 `FileUpload` 保持为表单上传组件。后续业务表单上传文件时，应参考 `experience/file-management-usage-guide.md`。

## 暂不实现

- 文件夹管理
- 文件分类树
- 文件移动
- 文件重命名真实文件
- 文件内容替换
- 文件权限管理
- 文件分享链接
- 分片上传
- 断点续传
- 秒传
- 文件在线编辑
- 图片裁剪
- 视频、音频专用播放器
- 复杂附件关系管理

## 后端已确认规则

来自 `docs/API_INTEGRATION_FEEDBACK.md` 第 9、10 条，以及 `docs/API_INTEGRATION_TODOS.md` 的文件管理模块确认结果：

- `GET /api/system/file/{id}/view` 预览接口已免登录放行，前端可直接用 `<img src>` 或 `<iframe src>` 预览。
- `GET /api/system/file/{id}/download` 下载接口仍需登录，失败时后端返回统一 JSON 错误。
- 下载响应文件名使用 RFC 5987 `filename*=UTF-8''` 编码；当前前端可优先使用 `record.originalName`。
- `status=0` 的文件仍可预览和下载，前端保持展示操作按钮。
- `POST /api/system/file/upload-batch` 始终返回 200，通过 `succeeded` 和 `failed` 数组区分成功和失败。
- 批量上传返回顺序与上传顺序一致。
- `businessModule` 可通过 `GET /api/system/dict/FILE_BUSINESS_MODULE/items` 获取。
- `mimeType` 无选项接口，前端使用文本筛选。

## 当前无阻塞 TODO

文件管理模块当前没有阻塞前端实现的后端待确认项。实现中如发现新疑问，再追加到 `docs/API_INTEGRATION_TODOS.md`。

## 验收标准

- `/system/file` 可访问
- 导航中出现 `文件管理`
- 文件列表使用真实分页接口
- 筛选、重置、刷新、分页可用
- 上传文件可用，成功后刷新列表
- 批量上传如有实现，能展示部分失败明细
- 详情弹窗可查看文件元数据
- 编辑弹窗只能修改 `businessModule` 和 `remark`
- 删除和批量删除有二次确认
- 启用/禁用可用，成功后刷新列表
- 图片和 PDF 可预览，其他文件提示下载
- `status=0` 文件仍可预览和下载
- 下载可触发浏览器保存
- 页面不直接堆 mock 数据
- 不引入新依赖
- 执行 `npm run build` 通过
- 执行 `npm run lint` 无新增 error

## 注意事项

- 不要把文件管理页面做成营销式资源库布局，保持后台列表页信息密度。
- 不要因为存在上传、预览、下载能力就抽象通用文件中心。
- 文件管理维护的是文件元数据，不负责业务附件关系。
- 业务表单保存文件时通常保存 `accessUrl` 或后端约定字段，不保存完整 `FileRecord`。
- 如实现中发现后端协议和 `docs/frontend-api-guide.md` 不一致，先追加到 `docs/API_INTEGRATION_TODOS.md`，不要自行扩展接口。
