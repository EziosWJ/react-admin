# 任务 25：代码审查问题修复

## 目标

修复代码审查发现的 11 个问题，涵盖功能性 bug、安全风险、竞态条件和代码质量。

## 问题清单与修复方案

### 高优先级（功能性 bug）

#### 1. 内置资源删除时 confirmLoading 永久卡死

- **文件**：`src/pages/system/roles/index.tsx`、`src/pages/system/menus/index.tsx`
- **问题**：`runConfirmAction` 中 `setConfirmLoading(true)` 后检测到内置资源直接 `return`，跳出 `try` 块，`finally` 不执行，按钮永久 loading
- **修复**：将 `isBuiltin` 检查移到 `setConfirmLoading(true)` 之前

#### 2. 登录页已登录跳转忽略 redirect 参数

- **文件**：`src/pages/login.tsx`
- **问题**：第 25 行计算了 `from`，但第 28 行硬编码跳 `/dashboard`
- **修复**：改为 `<Navigate to={from} replace />`

#### 3. Blob 下载 code=200 时静默返回空文件

- **文件**：`src/lib/http.ts`
- **问题**：HTTP 200 + JSON + code=200 时，`readJson` 消耗 body 后 `response.blob()` 返回 0 字节
- **修复**：当 JSON 解析成功且 code=200 时，抛出明确错误而非静默返回空 blob

#### 4. 401 拦截器无去重，并发请求多次触发

- **文件**：`src/lib/http.ts`、`src/store/auth-store.ts`
- **问题**：多个请求同时 401 会多次调用 `notifyUnauthorized`；`logout` 的 API 返回 401 也会触发拦截器
- **修复**：在 `notifyUnauthorized` 中加 `isRedirecting` 标志位做节流；`logout` 方法中临时禁用 401 handler

### 中优先级（安全 / 竞态）

#### 5. redirect 参数开放重定向风险

- **文件**：`src/store/auth-store.ts`、`src/pages/login.tsx`
- **问题**：攻击者可构造 `/login?redirect=https://evil.com` 诱导跳转
- **修复**：在 `login.tsx` 中对 `from` 做白名单校验，确保以 `/` 开头且不含 `//`

#### 6. login 与 fetchCurrentUser 竞态

- **文件**：`src/store/auth-store.ts`
- **问题**：`login` 直接 `await getCurrentUser()`，与 `fetchCurrentUser` 的 `isLoadingUser` 守卫互不感知
- **修复**：`login` 中复用 `fetchCurrentUser` 的守卫逻辑，或加统一锁

#### 7. 编辑表单详情请求竞态

- **文件**：`src/pages/system/users/index.tsx`、`src/pages/system/roles/index.tsx`、`src/pages/system/menus/index.tsx`
- **问题**：`openEditForm` 异步请求详情无取消机制，快速操作可能数据交叉
- **修复**：用 `AbortController` 取消前一次请求；在回调中校验是否为最新请求

### 低优先级（代码质量 / 无障碍）

#### 8. 半选状态计算错误

- **文件**：`src/components/common/tree-check-list.tsx`
- **问题**：`getNodeCheckState` 将节点自身 ID 计入 `childIds`
- **修复**：排除自身 ID，仅计算子节点选中情况

#### 9. Pagination option value 类型不匹配

- **文件**：`src/components/common/pagination.tsx`
- **问题**：`<option value={option}>` 中 `option` 是 number
- **修复**：改为 `value={String(option)}`

#### 10. 弹窗缺少焦点陷阱

- **文件**：`src/components/common/confirm-dialog.tsx`、`src/components/common/form-dialog.tsx`
- **问题**：`aria-modal="true"` 但无 focus trap
- **修复**：添加基础 focus trap（Tab 循环 + Escape 关闭）

#### 11. Token 明文存 localStorage

- **文件**：`src/store/auth-store.ts`
- **状态**：已知安全权衡，当前不修改，记录为后续改进项

## 并行分配

- Agent A：问题 1、2、3、4（高优先级，涉及 http.ts、auth-store.ts、login.tsx、roles/index.tsx、menus/index.tsx）
- Agent B：问题 5、6、7（中优先级，涉及 auth-store.ts、login.tsx、users/index.tsx、roles/index.tsx、menus/index.tsx）
- Agent C：问题 8、9、10（低优先级，涉及 tree-check-list.tsx、pagination.tsx、confirm-dialog.tsx、form-dialog.tsx）

## 验收标准

- 所有修复不引入新依赖
- 执行 `npm run build` 通过
- 执行 `npm run lint` 无新增 error
