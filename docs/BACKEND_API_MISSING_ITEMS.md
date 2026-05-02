# 后端接口补充清单

本文档基于 `docs/frontend-api-guide.md` 和当前前端对接需求整理，用于反馈给后端补充接口、完善字段文档和确认协议细节。

## 1. 必须补充或确认的接口

### 1.1 系统配置接口

当前前端已有系统配置页面，但 `frontend-api-guide.md` 未提供系统配置接口。

建议补充：

- `GET /api/system/config/page`
- `GET /api/system/config/{id}`
- `POST /api/system/config`
- `PUT /api/system/config/{id}`
- `DELETE /api/system/config/{id}`
- `DELETE /api/system/config/batch`
- `PATCH /api/system/config/{id}/status`
- `GET /api/system/config/{configKey}/value`

建议明确字段：

- `id`
- `configName`
- `configKey`
- `configValue`
- `configType`
- `status`
- `isBuiltin`
- `remark`
- `createTime`
- `updateTime`

### 1.2 角色选择接口

用户新增、编辑和分配角色时，需要角色选项列表。当前只有角色分页接口，前端可以临时使用分页接口，但不适合作为长期选择数据源。

建议补充：

- `GET /api/system/role/options`

建议返回启用角色：

```json
[
  {"id": 1, "roleName": "超级管理员", "roleCode": "admin"}
]
```

### 1.3 用户修改接口请求体

文档已提供新增用户请求体，但 `PUT /api/system/user/{id}` 未明确完整请求体。

建议补充：

- 修改用户允许提交的字段
- `username` 是否允许修改
- `status` 是否允许在修改接口中提交，还是只能走启停接口
- `roleIds` 是否只通过分配角色接口维护
- `isBuiltin=1` 用户的限制规则

### 1.4 菜单分页和详情响应示例

菜单新增请求体较完整，但菜单分页和详情响应字段示例不足。

建议补充菜单 records 和详情完整字段：

- `id`
- `parentId`
- `menuName`
- `menuType`
- `path`
- `component`
- `icon`
- `permissionCode`
- `sortOrder`
- `visible`
- `status`
- `externalUrl`
- `isBuiltin`
- `remark`
- `createTime`
- `updateTime`
- `children`，如分页接口不返回树形 children，也请明确说明

### 1.5 部门分页和详情响应示例

部门接口已列出，但分页和详情示例不够完整。

建议补充完整字段：

- `id`
- `parentId`
- `deptName`
- `deptCode`
- `leader`
- `phone`
- `email`
- `sortOrder`
- `status`
- `isBuiltin`
- `remark`
- `createTime`
- `updateTime`
- `children`

### 1.6 文件分页和详情响应示例

文件上传响应较完整，但文件分页和详情响应示例不足。

建议补充完整字段：

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
- `updateTime`

## 2. 建议补充的前端友好接口

### 2.1 当前用户权限码接口

后端已提供 `GET /api/auth/menus`，但如果前端后续需要控制按钮权限，建议单独提供当前用户权限码接口。

建议补充：

- `GET /api/auth/permissions`

建议返回：

```json
[
  "system:user:list",
  "system:user:add",
  "system:user:edit",
  "system:user:delete"
]
```

### 2.2 批量启用 / 禁用接口

当前各模块多为单条启停。后续列表批量操作场景较常见，建议补充批量状态修改接口。

建议补充：

- `PATCH /api/system/user/batch/status`
- `PATCH /api/system/role/batch/status`
- `PATCH /api/system/menu/batch/status`
- `PATCH /api/system/dept/batch/status`
- `PATCH /api/system/dict-type/batch/status`
- `PATCH /api/system/file/batch/status`

建议请求体：

```json
{"ids": [1, 2, 3], "status": 1}
```

### 2.3 唯一性校验接口

为了提升表单体验，建议提供关键字段唯一性校验接口。

建议覆盖：

- 用户名是否存在
- 角色编码是否存在
- 菜单权限码是否存在
- 部门编码是否存在
- 字典编码是否存在
- 配置 key 是否存在

接口形式可由后端统一设计，例如：

```text
GET /api/system/user/check-username?username=admin&id=1
GET /api/system/role/check-code?roleCode=admin&id=1
```

`id` 用于编辑场景排除当前记录。

### 2.4 字典批量查询接口

当前已有单个字典接口：

- `GET /api/system/dict/{dictCode}/items`

前端多个页面可能同时需要多个字典，建议补充批量查询。

建议接口：

- `GET /api/system/dict/items?codes=gender,user_status`

或：

- `POST /api/system/dict/items/batch`

建议返回：

```json
{
  "gender": [
    {"label": "男", "value": "MALE", "sortOrder": 1}
  ],
  "user_status": [
    {"label": "启用", "value": "1", "sortOrder": 1}
  ]
}
```

### 2.5 文件上传策略接口

前端上传组件需要展示大小、类型等限制时，建议后端提供上传策略。

建议补充：

- `GET /api/system/file/upload-policy`

建议返回：

```json
{
  "maxSize": 52428800,
  "allowedExtensions": ["jpg", "jpeg", "png", "pdf"],
  "allowedMimeTypes": ["image/jpeg", "image/png", "application/pdf"]
}
```

## 3. 菜单与路由需要确认

后端已提供 `GET /api/auth/menus`，但前端当前仍是静态路由和静态菜单。

需要确认：

- 后端菜单 `path` 是否会与前端实际路由完全一致
- 当前用户管理建议路径是 `/system/user`，前端现有路径是 `/users`，是否需要统一
- `component` 字符串是否需要固定映射规范
- 文件管理、部门管理、登录日志、操作日志、系统配置是否会进入菜单树

建议后端明确以下页面路径：

- `/system/user`
- `/system/role`
- `/system/menu`
- `/system/dept`
- `/system/dict`
- `/system/config`
- `/system/file`
- `/system/login-log`
- `/system/oper-log`

## 4. 协议细节需要确认

### 4.1 Token 字段

登录接口返回：

```json
{
  "tokenName": "Authorization",
  "tokenValue": "Bearer eyJhbGciOiJIUzI1NiJ9...",
  "expiresIn": 7200
}
```

需要确认：

- `tokenValue` 是否永远包含 `Bearer ` 前缀
- 前端是否应原样写入 `Authorization`
- 是否存在 token 即将过期的错误码或提示码

### 4.2 DELETE + Body

当前批量删除接口使用：

```text
DELETE /api/xxx/batch
Body: {"ids": [1, 2, 3]}
```

需要确认：

- 部署代理链路是否稳定支持 `DELETE + JSON Body`
- 如果不稳定，是否改为 `POST /api/xxx/batch-delete`

### 4.3 文件下载错误响应

文件下载接口返回文件流。

需要确认：

- 下载成功时返回 blob
- 下载失败时是否返回统一 JSON 错误
- 前端如何通过 `Content-Type` 区分文件流和错误 JSON

### 4.4 状态字段统一性

文档说明通用状态为：

- `status=1` 启用
- `status=0` 禁用

需要确认：

- 用户、角色、菜单、部门、字典、文件是否全部统一为 `1/0`
- 日志类状态是否例外，例如 `SUCCESS` / `FAIL`

### 4.5 内置数据限制

文档说明 `isBuiltin=1` 需要保护。

需要确认后端是否强校验：

- 内置用户禁止删除
- 内置角色禁止删除、禁止修改 `roleCode`
- 内置菜单禁止删除
- 内置部门禁止删除、禁止修改 `deptCode`
- 内置字典类型禁止删除、禁止修改 `dictCode`
- 内置系统配置禁止删除、禁止修改 `configKey`

前端会做 UI 禁用，但最终仍需要后端强校验。

## 5. 优先级建议

### P0：影响前端开始对接

- 系统配置接口是否存在
- 角色 options 接口
- 用户修改请求体
- 菜单分页和详情完整响应
- 部门分页和详情完整响应
- 文件分页和详情完整响应
- Token `tokenValue` 是否原样写入

### P1：提升开发效率和交互完整性

- 当前用户权限码接口
- 字典批量查询接口
- 文件上传策略接口
- 批量启用 / 禁用接口
- 唯一性校验接口

### P2：后续扩展

- 动态菜单路径和组件映射规范
- 文件、日志、配置是否进入菜单树
- 生产环境 API 文档暴露策略
