# API 对接待确认事项

## 系统配置模块

后端已补充系统配置接口文档：`doc/config-api.md`。原”系统配置模块后端未开发”待办已解除，前端后续按 `task/21-system-config-integration.md` 迁移真实接口。

以下细节已和后端确认，更新至 `doc/config-api.md`：

- [已确认] `isBuiltin=1` 的内置配置**可通过** `PATCH /api/system/config/{id}/status` 启用/禁用（后端未限制）。前端建议在 UI 上对内置配置项隐藏或禁用状态开关。
- [已确认] `valueType=NUMBER` 时，后端**不校验** `configValue` 是否为合法数字字符串。前端应在表单提交前自行校验。
- [已确认] `valueType=BOOLEAN` 时，后端只接受字符串 `”true”` / `”false”`，不接受 `”1”` / `”0”` 或布尔值。
- [已确认] `PUT /api/system/config/{id}` 修改时 `configKey` **必须提交**。前端可将输入框置灰，但仍需在请求体中携带原 `configKey` 值。
- [已确认] `configKey` 可能包含 `/`。前端应使用 `encodeURIComponent(configKey)` 编码后作为路径参数传递。
