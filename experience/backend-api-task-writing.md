# 后端接口文档转前端执行任务经验

## 适用场景

当用户提供某个模块的后端接口文档，并要求：

- 阅读后端给前端的接口文档
- 结合当前前端代码现状
- 生成独立、可分配给 agent 执行的 task 文档
- 如果有疑问或需要和后端确认，写入 docs 下的 TODO 文档
- 能明确的部分先设计成可执行任务，后续 agent 可直接按任务实现代码

就按本文档流程处理。

## 核心目标

输出的不是泛泛分析，而是“后续 agent 能独立执行”的任务文档。

任务文档必须做到：

- 范围明确
- 文件边界明确
- 前置依赖明确
- 接口路径和字段明确
- 实现要求可操作
- 验收标准可验证
- 疑问项集中进入 docs TODO，不阻塞已明确的开发内容

## 输入材料

通常会有这些材料：

- 后端新提供的模块接口文档，例如 `docs/config-api.md`
- 当前已有 API 对接 TODO，例如 `docs/API_INTEGRATION_TODOS.md`
- 当前任务拆解目录 `task/`
- 当前页面、类型、API 封装，例如：
  - `src/pages/**`
  - `src/api/**`
  - `src/types/**`
  - `src/router.tsx`
  - `src/config/navigation.ts`

如果用户只给了一个文档路径，先读取该文档，再读取相关现状文件，不要只根据文档凭空写任务。

## 工作流程

### 1. 读取后端文档

重点提取：

- 模块目标
- 字段定义
- 枚举值
- 接口路径
- 请求参数
- 请求体
- 响应结构
- 错误规则
- 前端对接建议
- 内置数据、权限、状态等限制

需要特别关注：

- 分页结构是否和现有 `ApiPageResult` 一致
- 状态字段是否仍为 `1 | 0`
- 批量接口是否使用 `POST /batch-delete`
- 字段命名是否和现有前端类型冲突
- 是否存在按 key、options、tree、detail 等配套接口

### 2. 读取前端现状

按模块定位现有文件：

- 页面文件：`src/pages/...`
- API 文件：`src/api/...`
- 类型文件：`src/types/...`
- mock 数据：`src/mocks/...`
- 路由与导航：`src/router.tsx`、`src/config/navigation.ts`
- 公共组件：`src/components/common/...`

判断当前模块是：

- 尚未实现
- 只有 mock
- 已接部分真实接口
- 字段协议需要调整
- 页面过大需要顺带拆分
- 需要后端补充能力

### 3. 区分“可实现”和“待确认”

可实现的内容写入 task。

待确认的内容写入 docs TODO。

不要因为少量疑问阻塞整个任务设计。对疑问项采用保守策略：

- 文档明确的，按文档写任务
- 文档缺失但不影响主流程的，写 TODO
- 文档冲突或会影响实现路径的，写 TODO，并在任务中标为“实现时按保守策略处理”

### 4. 生成 task 文档

任务文件放到 `task/` 下，按当前编号递增命名。

命名建议：

```text
task/21-system-config-integration.md
task/22-xxx-module-integration.md
task/23-xxx-refactor.md
```

每个 task 应包含这些部分：

- `目标`
- `参考文档`
- `前置依赖`
- `负责范围`
- `后端接口`
- `类型设计`
- `API 实现要求`
- `页面实现要求`
- `字典/枚举/选项要求`，如适用
- `拆分建议`，如适用
- `暂不实现`
- `待确认事项`
- `验收标准`
- `注意事项`

## task 文档写法要求

### 负责范围

必须明确“主要负责”和“避免修改”。

示例：

```md
## 负责范围

主要负责：

- `src/api/system.ts`
- `src/types/system.ts`
- `src/pages/system-configs.tsx`

避免修改：

- `src/router.tsx`
- 用户、角色、菜单、部门页面
- 认证逻辑
```

这样后续 agent 可独立执行，减少互相覆盖。

### 接口列表

接口路径要直接写出来，不要只写“按文档实现”。

示例：

```md
- `GET /api/system/config/page`
- `GET /api/system/config/{id}`
- `POST /api/system/config`
- `PUT /api/system/config/{id}`
- `DELETE /api/system/config/{id}`
```

### 类型设计

后端字段比较明确时，直接给 TypeScript 类型建议。

类型要贴近后端协议，不要继续沿用旧 mock 字段。

示例：

```ts
export type SystemConfigRecord = {
  id: number;
  configName: string;
  configKey: string;
  configValue?: string | null;
  status: ApiStatus;
};
```

### 实现要求

写成 agent 可执行的条目，避免抽象描述。

好的写法：

- 使用真实分页，参数为 `page/pageSize/configName/configKey/status`
- 编辑时 `configKey` 置灰
- `isBuiltin=1` 禁止删除
- 成功后刷新列表并清理缓存

不好的写法：

- 完善页面
- 对接接口
- 优化体验

### 验收标准

必须可验证。

常用验收项：

- 页面不再读取 mock
- 指定路由可访问
- 列表、新增、编辑、删除、启停可用
- 执行 `npm run build` 通过
- 执行 `npm run lint` 无新增 error

## TODO 文档规则

如果有疑问，写入 `docs/API_INTEGRATION_TODOS.md`。

如果该文档不存在，就新建。

TODO 应该包含：

- 所属模块
- 已明确状态
- 待确认问题
- 前端保守处理策略，如有

示例：

```md
## 系统配置模块

后端已补充接口文档：`docs/config-api.md`。前端后续按 `task/21-system-config-integration.md` 迁移真实接口。

仍需和后端确认的细节：

- TODO：`isBuiltin=1` 的内置配置是否也禁止启停。
- TODO：`valueType=BOOLEAN` 是否只接受 `"true"` / `"false"` 字符串。
```

不要把 TODO 分散写到多个页面注释里。需要和后端沟通的事项集中写到 docs。

## README 更新规则

如果新增了 task，需要视情况更新 `task/README.md`：

- 加入推荐执行顺序
- 标注能否并行
- 标注前置依赖
- 标注最后集成任务

如果只是新增一个独立模块任务，也应在 README 中加一句说明，方便用户后续分配 agent。

## 拆分与并行设计经验

当一个任务会被多个 agent 并行执行时，要降低冲突：

- 模块任务不要同时修改 `src/router.tsx`
- 旧页面文件可以先保留为 re-export 兼容层
- 各模块只写自己的新目录
- 最后单独设计一个 router cleanup 任务统一收尾

示例：

```ts
export { SystemDictsPage } from "@/pages/system/dicts";
```

这种方式可以让页面迁移任务互不影响路由。

## 何时只写任务，不写代码

用户要求“设计 task”“生成任务文档”“后续让 agent 执行”时，只写文档，不改业务代码。

除非用户明确说“开始实现代码”，否则不要顺手改页面和 API。

## 何时需要实现代码

用户要求“根据 task 开始做”“能完成的代码可以开始工作”时，才进入实现阶段。

实现阶段规则：

- 先读 task 和后端文档
- 明确范围
- 能做的先做
- 疑问写 TODO
- 不自行设计后端不存在的接口
- 完成后执行 `npm run build`
- 如有 `lint`，按需执行

## 不要做的事

- 不要凭空扩展后端接口
- 不要把疑问留在聊天里不落文档
- 不要把 task 写成泛泛建议
- 不要在模块任务中随意改其他模块
- 不要引入新请求库或 UI 框架
- 不要把所有 CRUD 抽成复杂框架
- 不要为了拆分而改变业务行为

## 最终回复格式

完成后简要说明：

- 新增了哪些 task 文件
- 更新了哪些 docs TODO
- 是否只改文档
- 是否执行了 build
- 当前是否有未完成事项

示例：

```md
已根据 `docs/config-api.md` 生成系统配置迁移任务：

- `task/21-system-config-integration.md`

同时更新了：

- `docs/API_INTEGRATION_TODOS.md`
- `task/README.md`

本次只更新文档，没有改业务代码，也没有执行 build。
```

## 核心判断标准

这类任务完成得好不好，看三个结果：

1. 后续 agent 能不能不问问题就开始执行。
2. 需要后端确认的点是否集中、明确、可转发。
3. 已明确的开发内容是否没有被疑问项阻塞。
