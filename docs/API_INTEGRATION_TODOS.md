# API 对接待确认事项

- 开发环境后端地址是否固定为 `http://localhost:8080`。当前 `VITE_API_BASE_URL` 默认留空，直接请求同源 `/api`。
- 文件下载失败时后端是否统一返回 JSON 错误。当前 HTTP 层已在 blob 响应中兼容 `application/json` 错误体。
- 批量删除使用 `DELETE` 携带 JSON body 时，后端部署链路和代理链路是否都会放行。
- 用户分配角色当前临时使用 `GET /api/system/role/page?page=1&pageSize=100&status=1` 加载启用角色；后端建议补充轻量角色 options 接口，避免分页接口承担下拉/勾选选项职责。
- 新增或编辑顶级部门时，前端当前在未选择上级部门的情况下提交 `parentId: 0`；需确认后端是否约定顶级部门使用 `0`，还是应允许省略 `parentId`。
- 菜单详情 `GET /api/system/menu/{id}` 文档未展开响应字段；前端当前按菜单分页记录同构处理，并依赖 `externalUrl`、`visible`、`isBuiltin`、`remark` 等字段用于编辑回显和内置保护。
- 文件分页 `GET /api/system/file/page` 和文件详情 `GET /api/system/file/{id}` 文档未展开完整响应字段；前端当前按上传返回字段补充 `status` 后同构定义 `FileRecord`，需确认分页/详情是否稳定返回 `status`、`businessModule`、`remark`、`createTime`。
- 操作日志详情 `GET /api/system/oper-log/{id}` 文档未明确请求参数摘要和响应结果摘要字段名；前端当前兼容 `requestParams`、`requestParam`、`requestBody`、`responseResult`、`responseData`，需确认后端最终字段名。
- 静态路由已新增后端建议路径别名并保留旧路径可访问：`/system/user` 对应旧 `/users`，`/system/dept` 对应旧 `/system/depts`，`/system/role` 对应旧 `/system/roles`，`/system/menu` 对应旧 `/system/menus`，`/system/dict` 对应旧 `/system/dicts`，`/system/config` 对应旧 `/system/configs`；需确认后端菜单树最终是否统一下发这些单数路径。
- 系统配置接口当前未出现在 `docs/frontend-api-guide.md` 中；前端 `src/pages/system-configs.tsx` 保留本地 mock 数据并在页面标注“后端配置接口待补充”，新增、编辑、删除等写操作暂不接入。后续需由后端补充正式接口协议后再迁移，前端不自行约定接口路径。
