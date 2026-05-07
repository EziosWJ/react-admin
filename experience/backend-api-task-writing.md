# 后端接口文档转前端任务

## 适用场景

用户给后端接口文档，要求生成可分配给 agent 执行的 task 文档。

## 输入材料

- 后端接口文档，如 `docs/config-api.md`
- 现有 TODO：`docs/API_INTEGRATION_TODOS-{date}.md`
- 现有任务：`task/`
- 前端相关：`src/pages/**`、`src/api/**`、`src/types/**`、`src/router.tsx`、`src/config/navigation.ts`

只给文档路径时，先读文档，再读现状文件，不凭空写任务。

## 工作流程

### 1. 读文档提取

模块目标、字段定义、枚举值、接口路径、请求参数/体、响应结构、错误规则、前端建议。

重点关注：
- 分页结构是否兼容 `ApiPageResult`
- 状态字段是否 `1 | 0`
- 批量接口是否 `POST /batch-delete`
- 字段命名是否与前端类型冲突
- 是否有 key/options/tree/detail 配套接口

### 2. 读前端现状

定位：页面、API、类型、mock、路由导航、公共组件。

判断状态：未实现 / 只有 mock / 已接部分接口 / 字段需调整 / 页面需拆分 / 需后端补充。

### 3. 分流

- 可实现 → 写 task
- 待确认 → 写 `docs/API_INTEGRATION_TODOS.md`
- 疑问不阻塞明确内容，保守策略优先

### 4. 生成 task

文件放 `task/`，按编号递增：`task/21-system-config-integration.md`

## task 结构

```
目标
参考文档
前置依赖
负责范围
后端接口
类型设计
API 实现要求
页面实现要求
字典/枚举/选项要求（如适用）
拆分建议（如适用）
暂不实现
待确认事项
验收标准
注意事项
```

## 写法要求

### 负责范围

必须列"主要负责"和"避免修改"文件，减少 agent 间冲突。

### 接口列表

直接写路径，不写"按文档实现"：
- `GET /api/system/config/page`
- `POST /api/system/config`

### 类型设计

后端字段明确时给 TS 类型，贴近后端协议，不用旧 mock 字段。

### 实现要求

写可执行条目，不写抽象描述。

好：使用真实分页，参数 `page/pageSize/configName/configKey/status`；编辑时 `configKey` 置灰；`isBuiltin=1` 禁止删除。

差：完善页面；对接接口；优化体验。

### 验收标准

必须可验证：页面不读 mock、路由可访问、CRUD 可用、`npm run build` 通过、`npm run lint` 无新增 error。

## TODO 文档规则

疑问写入 `docs/API_INTEGRATION_TODOS-{date}.md`（不存在则新建），包含：所属模块、已明确状态、待确认问题、保守处理策略。不分散到页面注释。

## README 更新

新增 task 后更新 `task/README.md`：推荐执行顺序、能否并行、前置依赖、最后集成任务。

## 并行设计

- 模块任务不同时改 `src/router.tsx`
- 旧页面保留 re-export 兼容层
- 各模块只写自己目录
- 单独 router cleanup 任务收尾

## 何时只写文档

用户说"设计 task""生成任务文档""后续 agent 执行"→ 只写文档，不改代码。

## 何时实现代码

用户说"根据 task 开始做""能完成的代码可以开始工作"→ 进入实现：先读 task 和文档、明确范围、能做先做、疑问写 TODO、不自造接口、完成后 `npm run build`。

## 不做的事

- 不凭空扩展后端接口
- 不把疑问留聊天不落文档
- 不把 task 写成泛泛建议
- 不在模块任务中改其他模块
- 不引入新请求库/UI 框架
- 不把 CRUD 抽成复杂框架
- 不为拆分改变业务行为

## 完成回复格式

```
已根据 `docs/xxx.md` 生成任务：
- `task/xx-xxx.md`
同时更新：`docs/API_INTEGRATION_TODOS.md`、`task/README.md`
本次只更新文档，没有改业务代码。
```

## 核心判断

1. agent 能否不问问题就开始执行
2. 待确认点是否集中、明确、可转发
3. 已明确内容是否未被疑问阻塞
