# 任务 21：系统配置模块真实接口迁移

## 目标

根据 `docs/config-api.md` 将系统配置管理从本地 mock 迁移到后端真实接口，补齐配置分页、详情、新增、编辑、删除、批量删除、启停和按配置键查询能力。

## 参考文档

- `docs/config-api.md`
- `docs/API_INTEGRATION_TODOS.md`
- `task/12-system-config-follow-up.md`

## 前置依赖

- 任务 00：API 基础设施
- 任务 01：公共基础组件
- 任务 14：页面拆分公共基础提取，可选

如果任务 14 尚未完成，本任务可以继续使用当前页面内的弹窗结构，不阻塞系统配置接口迁移。

## 负责范围

主要负责：

- `src/api/system.ts`
- `src/types/system.ts`
- `src/pages/system-configs.tsx`
- `src/types/index.ts`

可按需新增：

- `src/pages/system/configs/index.tsx`
- `src/pages/system/configs/columns.tsx`
- `src/pages/system/configs/schema.ts`
- `src/pages/system/configs/config-form-dialog.tsx`
- `src/pages/system/configs/utils.ts`

避免修改：

- `src/router.tsx`
- `src/config/navigation.ts`
- 用户、角色、菜单、部门、字典、日志页面
- 认证逻辑

## 后端接口

- `GET /api/system/config/page`
- `GET /api/system/config/{id}`
- `GET /api/system/config/key/{configKey}`
- `POST /api/system/config`
- `PUT /api/system/config/{id}`
- `DELETE /api/system/config/{id}`
- `POST /api/system/config/batch-delete`
- `PATCH /api/system/config/{id}/status`

## 类型设计

新增或替换系统配置类型：

```ts
export type SystemConfigType = "SYSTEM" | "CUSTOM";

export type SystemConfigValueType = "TEXT" | "NUMBER" | "BOOLEAN";

export type SystemConfigRecord = {
  id: number;
  configName: string;
  configKey: string;
  configValue?: string | null;
  configType: SystemConfigType;
  valueType: SystemConfigValueType;
  status: ApiStatus;
  isBuiltin: ApiBuiltinFlag;
  remark?: string | null;
  createTime?: string | null;
  updateTime?: string | null;
};

export type SystemConfigValueRecord = {
  configKey: string;
  configValue?: string | null;
  valueType: SystemConfigValueType;
  configName: string;
};
```

请求类型建议：

- `SystemConfigListQuery`
- `SystemConfigCreateRequest`
- `SystemConfigUpdateRequest`
- `SystemConfigStatusRequest`
- `SystemConfigBatchDeleteRequest`

## API 实现要求

在 `src/api/system.ts` 中移除配置管理 mock 入口，新增真实接口方法：

- `getSystemConfigPage(query)`
- `getSystemConfigDetail(id)`
- `getSystemConfigByKey(configKey)`
- `createSystemConfig(data)`
- `updateSystemConfig(id, data)`
- `deleteSystemConfig(id)`
- `batchDeleteSystemConfigs(data)`
- `updateSystemConfigStatus(id, data)`

按 key 查询必须使用 `encodeURIComponent(configKey)`。后端已确认 `configKey` 可能包含 `/`，不能直接拼接原始字符串到路径中。

可选实现配置值缓存：

- `getSystemConfigByKey(configKey, forceRefresh = false)`
- `clearSystemConfigCache(configKey?)`

新增、修改、删除、批量删除、启停后应清理配置值缓存。

## 页面实现要求

1. 列表查询
   - 使用真实分页
   - 查询参数支持：
     - `configName`
     - `configKey`
     - `configType`
     - `status`
   - 分页使用后端 `records/total/page/pageSize`

2. 表格字段
   - 配置名称：`configName`
   - 配置键：`configKey`
   - 配置值：`configValue`
   - 配置类型：`configType`
   - 值类型：`valueType`
   - 状态：`status`
   - 属性：`isBuiltin`
   - 创建时间或更新时间：优先展示 `updateTime`，可同时保留 `createTime`

3. 表单
   - `configName`：必填，最长 100
   - `configKey`：必填，最长 100，编辑时置灰不可修改，但更新请求体中仍必须携带原 `configKey`
   - `configValue`：最长 500，并按 `valueType` 做前端提交前校验
   - `configType`：下拉，优先通过字典 `CONFIG_TYPE` 获取
   - `valueType`：下拉，优先通过字典 `CONFIG_VALUE_TYPE` 获取
   - `status`：启用/禁用
   - `remark`：文本域

4. `configValue` 输入控件
   - `TEXT`：文本输入框
   - `NUMBER`：数字输入框，前端必须校验可转换为合法数字字符串
   - `BOOLEAN`：下拉、单选或开关，提交时必须转换为小写字符串 `"true"` / `"false"`
   - 后端不校验 `configValue` 是否匹配 `valueType`，前端必须在表单提交前完成校验

5. 内置配置保护
   - `isBuiltin=1` 禁止编辑
   - `isBuiltin=1` 禁止删除
   - 批量删除时后端会跳过内置项，前端仍应在 UI 上标识内置项
   - 后端允许内置配置启用/禁用，但前端建议隐藏或禁用内置项状态开关，避免误操作

6. 状态操作
   - 使用 `PATCH /api/system/config/{id}/status`
   - 成功后刷新列表并清理配置缓存
   - 对 `isBuiltin=1` 的记录，列表操作区默认不展示或禁用启停按钮

## 字典选项要求

配置类型和值类型已初始化为字典：

- `CONFIG_TYPE`
- `CONFIG_VALUE_TYPE`

页面应优先通过 `getDictItems(dictCode)` 获取选项。接口异常时可以降级为本地枚举兜底：

- `SYSTEM`：系统配置
- `CUSTOM`：自定义配置
- `TEXT`：文本
- `NUMBER`：数字
- `BOOLEAN`：布尔

## 拆分建议

如果执行时同时做页面拆分，建议采用：

```text
src/pages/system/configs/
  index.tsx
  columns.tsx
  schema.ts
  config-form-dialog.tsx
  utils.ts
```

并保留 `src/pages/system-configs.tsx` 作为兼容导出：

```ts
export { SystemConfigsPage } from "@/pages/system/configs";
```

如果当前目标只是接口迁移，也可以先保留单文件页面，后续交给任务 20 统一清理。

## 暂不实现

- 配置导入导出
- 配置修改历史
- 批量启停
- 复杂配置值 JSON 编辑器
- 动态表单渲染器

## 后端已确认规则

以下规则来自后端对 `docs/API_INTEGRATION_TODOS.md` 的反馈，并已同步到 `docs/config-api.md`：

- `isBuiltin=1` 的内置配置后端允许通过 `PATCH /api/system/config/{id}/status` 启用/禁用；前端仍建议隐藏或禁用状态开关。
- `valueType=NUMBER` 时，后端不校验 `configValue` 是否为合法数字字符串；前端必须自行校验。
- `valueType=BOOLEAN` 时，后端只接受字符串 `"true"` / `"false"`，不接受 `"1"` / `"0"` 或布尔值。
- `PUT /api/system/config/{id}` 修改时 `configKey` 必须提交；前端可将输入框置灰，但请求体仍需携带原 `configKey`。
- `configKey` 可能包含 `/`；前端按 key 查询接口必须使用 `encodeURIComponent(configKey)`。

## 当前无阻塞 TODO

系统配置模块当前没有阻塞前端实现的后端待确认项。实现过程中如果发现新疑问，追加到 `docs/API_INTEGRATION_TODOS.md`。

## 验收标准

- 配置管理页面不再使用本地 mock
- 页面不再显示“后端配置接口待补充”
- 分页、查询、新增、编辑、删除、启停可用
- 按配置键查询 API 可供其他模块复用
- 内置配置的 UI 限制生效
- 执行 `npm run build` 通过
- 执行 `npm run lint` 无新增 error

## 注意事项

- 不要修改系统配置以外的业务模块。
- 不要引入新 UI 框架或请求库。
- 不要自行扩展后端未提供的接口。
