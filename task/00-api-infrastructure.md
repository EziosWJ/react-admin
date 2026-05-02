# 任务 00：API 基础设施

## 目标

建立真实后端接口对接所需的最小基础设施，供后续所有模块复用。

## 参考文档

- `docs/frontend-api-guide.md`
- `docs/BACKEND_INTEGRATION_CHECKLIST.md`

## 负责范围

主要负责：

- `src/lib/http.ts`
- `src/types/api.ts`
- `src/lib/api-error.ts`，如决定拆出错误类
- `src/types/index.ts`
- `.env.development`
- `.env.production`
- 可选：`vite.config.ts`，仅在需要开发代理时修改

避免修改：

- 具体业务页面
- 具体领域 API 文件，除非为了编译验证做极小适配
- 认证 store

## 后端协议

- 接口统一前缀：`/api`
- 成功响应：`{ code: 200, message: "success", data }`
- 失败响应：`{ code, message, data }`
- 分页响应：`data.records`、`data.total`、`data.page`、`data.pageSize`
- 认证头：`Authorization: Bearer <token>`
- 401 表示未登录或 Token 失效

## 实现要求

1. 新增统一 API 类型：
   - `ApiResponse<T>`
   - `ApiPageRequest`
   - `ApiPageResult<T>`
   - `ApiFieldErrors`
   - `ApiStatus`
   - 可选：`ApiBuiltinFlag`
2. 新增统一错误模型：
   - 包含 `code`
   - 包含 `message`
   - 包含可选 `fieldErrors`
   - 能区分网络错误、业务错误、401、403、404、500
3. 新增 `http` 请求封装：
   - 支持 `GET`、`POST`、`PUT`、`PATCH`、`DELETE`
   - 支持 query 参数
   - 支持 JSON body
   - 支持 `FormData`
   - 支持 blob 下载
   - 自动解析统一响应
   - `code !== 200` 时抛出统一错误
4. Token 获取方式保持解耦：
   - 可以通过 `setAuthTokenGetter` 或轻量方法注入
   - 不要让 `http.ts` 直接依赖具体页面
5. 401 处理保持解耦：
   - 可以通过 `setUnauthorizedHandler` 注册
   - 由认证任务接入跳转和清理登录态
6. 环境变量：
   - 使用 `VITE_API_BASE_URL`
   - 默认可为空，直接请求 `/api`

## 验收标准

- `src/lib/http.ts` 能被领域 API 直接复用
- `src/types/api.ts` 已从 `src/types/index.ts` 导出
- 原生 `fetch` 封装可处理 JSON、FormData、blob
- 不引入 `axios` 或其他请求库
- 执行 `npm run build` 通过

## 注意事项

- 后端登录接口返回的 `tokenValue` 已包含 `Bearer ` 前缀，HTTP 层后续应支持原样写入 `Authorization`。
- `DELETE` 需要支持 JSON body，因为后端批量删除接口使用 `DELETE + Body`。
