# API 对接待确认事项

## 文件管理模块

后端已在 `docs/frontend-api-guide.md` 中提供文件管理接口。前端后续按 `task/22-file-management-page.md` 实现文件管理页面，并参考 `experience/file-management-usage-guide.md` 处理上传、预览和下载场景。

以下细节已确认或处理：

- [已处理] `GET /api/system/file/{id}/view` 预览接口已免登录放行，下载接口仍需登录。后续计划改为签名 URL。
- [已确认] `GET /api/system/file/{id}/download` 使用 RFC 5987 `filename*=UTF-8''` 编码。前端优先使用列表中的 `originalName` 作为文件名。
- [已确认] `status=0` 的文件仍可预览和下载。前端保持展示操作按钮。
- [已修复] `POST /api/system/file/upload-batch` 返回顺序与上传顺序一致；新增部分失败处理，返回 `{succeeded, failed}` 结构。
- [已确认] `businessModule` 可通过 `GET /api/system/dict/FILE_BUSINESS_MODULE/items` 获取；`mimeType` 无选项接口，前端用文本筛选。

## 当前用户菜单模块

后端已在 `docs/frontend-api-guide.md` 中提供 `GET /api/auth/menus`。前端后续按 `task/24-auth-dynamic-navigation.md` 将侧边栏业务菜单改为当前用户菜单接口驱动，同时保留默认 Dashboard 和 Demo 菜单。

以下细节已确认，可按确认结果实现侧边栏动态菜单：

- [已确认] 后端菜单 `path` 保证和当前前端静态路由完全一致，例如 `/system/user`、`/system/dept`、`/system/dict`、`/system/config`、`/system/file`。前端可按 `path` 匹配已注册页面。
- [已确认] 后端不返回 Dashboard 或 Demo 菜单。前端继续使用本地硬编码默认菜单。
- [已确认] `menuType=LINK` 的外链需要在第一版侧边栏展示，前端按新窗口打开处理。
- [已确认] `menuType=DIR` 有 `path` 但没有任何 `visible=1` 子菜单时，前端不展示该空目录。
