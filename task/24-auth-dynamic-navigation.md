# 任务 24：当前用户动态侧边栏菜单

## 目标

将左侧菜单从固定 `navItems` 改为登录后调用 `GET /api/auth/menus` 获取当前用户菜单，并转换为侧边栏导航。

本任务必须保留本地默认菜单：

- `Dashboard`
- `页面示例` 下的 Demo 菜单

后端返回的用户菜单只用于补充业务导航，不替代默认 Dashboard 和 Demo。

## 参考文档

- `docs/frontend-api-guide.md` 的“2.4 获取当前用户菜单”
- `docs/current-user-menu-feedback.md`
- `docs/API_INTEGRATION_TODOS.md`
- `task/02-auth-integration.md`
- `task/10-route-navigation-alignment.md`
- `experience/backend-api-task-writing.md`

## 前置依赖

- `src/api/auth.ts` 已封装 `getCurrentUserMenus`
- `src/types/auth.ts` 已定义 `CurrentUserMenu`
- `src/lib/menu-icons.ts` 已提供后端图标字符串到 lucide 图标的映射
- 当前路由仍由 `src/router.tsx` 静态注册

## 负责范围

主要负责：

- `src/store/auth-store.ts`
- `src/types/auth.ts`
- `src/config/navigation.ts`
- `src/components/layout/app-sidebar.tsx`
- `src/components/layout/breadcrumbs.tsx`
- `src/lib/menu-icons.ts`

可按需小幅修改：

- `src/api/auth.ts`
- `src/router.tsx`，仅用于确认已有静态路由 path 是否覆盖后端菜单 path
- `src/types/index.ts`

避免修改：

- 各业务页面内部实现
- 用户、角色、菜单、部门、字典、配置、日志、文件页面逻辑
- 登录页 UI
- 完整动态路由系统
- RBAC 权限守卫模型

## 后端接口

- `GET /api/auth/menus`

响应结构：

```ts
export type CurrentUserMenu = {
  id: number;
  parentId: number;
  menuName: string;
  menuType: "DIR" | "MENU" | "LINK";
  path: string;
  component: string | null;
  externalUrl?: string | null;
  icon: string | null;
  permissionCode: string | null;
  sortOrder: number;
  visible: 0 | 1;
  children: CurrentUserMenu[];
};
```

后端规则：

- `menuType`：`DIR`=目录，`MENU`=菜单，`LINK`=外链
- `visible=1` 才显示在菜单栏
- 根节点 `parentId=0`
- 按 `sortOrder` 排序
- `path` 由后端维护，前端直接用于导航
- 后端已确认菜单 `path` 保证和当前前端静态路由完全一致
- `component` 是后端给出的前端本地组件路径字符串，本任务不使用它做动态 import
- `LINK` 类型使用 `externalUrl`，第一版按新窗口打开
- 后端不返回 Dashboard 或 Demo 菜单，前端继续使用本地默认菜单
- `DIR` 过滤后没有任何 `visible=1` 子菜单时不展示

## 类型设计

保留 `CurrentUserMenu`，并为侧边栏导航继续使用 `NavItem`。

建议调整 `AuthState`：

```ts
export type AuthState = {
  token: string | null;
  user: CurrentUser | null;
  menus: CurrentUserMenu[];
  isAuthenticated: boolean;
  isLoadingUser: boolean;
  isLoadingMenus: boolean;
  login: (username: string, password: string) => Promise<CurrentUser>;
  fetchCurrentUser: () => Promise<CurrentUser | null>;
  fetchCurrentUserMenus: (force?: boolean) => Promise<CurrentUserMenu[]>;
  logout: () => Promise<void>;
  clearAuth: () => void;
};
```

如果不想把菜单放进认证 store，也可以新建轻量 `navigation-store`。但当前菜单强依赖登录态，优先扩展 `auth-store`，避免新增不必要的全局状态入口。

## API 实现要求

优先复用：

- `getCurrentUserMenus()`

要求：

- 请求必须携带 `Authorization`
- 登录成功后获取当前用户信息，再获取当前用户菜单
- 页面刷新恢复 token 后，应能重新获取用户菜单
- 退出登录或 401 时清空菜单
- 菜单请求失败不应导致 token 被清理，除非后端返回 401
- 菜单请求失败时保留默认 Dashboard 和 Demo，并在侧边栏给出轻量错误状态或 toast 提示

## 导航实现要求

### 1. 拆分默认菜单

将当前固定 `navItems` 拆分为：

- `defaultNavItems`
- `staticRouteTitleMap`

`defaultNavItems` 必须只包含：

- `Dashboard`
- `页面示例`

`页面示例` 下继续保留：

- `表单示例`
- `列表页 Demo`
- `树形结构 Demo`
- `左树右表 Demo`
- `详情页 Demo`

不要从后端菜单中删除或覆盖这些默认项。

### 2. 后端菜单转换

新增纯函数，建议放在 `src/config/navigation.ts`：

```ts
export function convertUserMenusToNavItems(menus: CurrentUserMenu[]): NavItem[];
```

转换规则：

- 过滤 `visible !== 1` 的菜单
- 按 `sortOrder` 升序排序
- `DIR` 转为有 children 的 `NavItem`
- `MENU` 转为可点击 `NavItem`
- `LINK` 转为外链 `NavItem`，使用 `externalUrl` 并按新窗口打开
- `label` 使用 `menuName`
- `MENU` 和 `DIR` 的 `path` 使用后端 `path`
- `LINK` 的 `path` 可使用 `externalUrl` 或 `path` 作为唯一 key，但点击目标必须优先使用 `externalUrl`
- `icon` 使用 `getMenuIcon(menu.icon)`
- 空 children 的 `DIR` 不展示
- 未匹配图标使用默认图标

### 3. 合并菜单

侧边栏最终菜单：

```text
defaultNavItems + convertUserMenusToNavItems(currentUserMenus)
```

要求：

- Dashboard 永远在第一项
- Demo 永远保留
- 后端业务菜单按后端顺序展示在默认菜单之后
- 后端已确认不返回 Dashboard 或 Demo 菜单，但合并时仍建议按 `path` 去重，默认菜单优先

### 4. 侧边栏读取动态菜单

`AppSidebar` 不再直接使用固定 `navItems`。

建议方式：

- 从 `useAuthStore` 读取 `menus` 和加载状态
- 使用 `useMemo` 生成最终 `sidebarNavItems`
- 保留现有展开、高亮、折叠交互

加载态：

- 初次加载菜单时可以只展示 Dashboard 和 Demo
- 或在业务菜单区展示轻量 loading
- 不要阻塞主内容区渲染

错误态：

- 菜单加载失败时仍展示 Dashboard 和 Demo
- 不要让整个后台空白

### 5. 面包屑标题

`Breadcrumbs` 当前使用 `routeTitleMap`。

要求：

- 默认菜单和静态页面继续使用 `staticRouteTitleMap`
- 后端菜单转换时生成动态 path -> title 映射
- 面包屑优先使用动态菜单标题，再 fallback 到静态标题
- 如果当前路径没有匹配，继续显示 `页面`

可以新增工具函数：

```ts
export function buildRouteTitleMapFromNavItems(items: NavItem[]): Record<string, string>;
```

### 6. 路由边界

本任务不实现完整动态路由。

原因：

- 当前页面组件已经在 `src/router.tsx` 静态注册
- 后端 `component` 字段需要前端维护组件映射，当前阶段不展开
- 用户需求重点是左侧菜单动态化

实现时只需要保证：

- 后端返回的 `path` 能命中现有静态路由
- 未注册 path 点击后进入现有 404，不新增动态 import

如果需要补充兼容路由别名，应只补明确已有页面对应的 path，不要做任意动态路由。

## 默认菜单保留要求

无论后端返回什么，以下路由必须一直在菜单中可见：

- `/dashboard`
- `/forms/basic`
- `/examples/list`
- `/examples/tree`
- `/examples/tree-table`
- `/examples/detail`

如果后端菜单接口返回空数组：

- 侧边栏仍显示 Dashboard 和 Demo
- 不显示系统管理业务菜单

如果菜单接口失败：

- 侧边栏仍显示 Dashboard 和 Demo
- 可以提示“菜单加载失败”

## 暂不实现

- 完整动态路由
- 根据 `component` 动态 import 页面组件
- 动态菜单接口驱动路由注册
- RBAC 权限守卫重构
- 多租户菜单
- 菜单缓存失效策略
- 菜单编辑页改造
- 外链打开方式复杂配置
- 后端菜单覆盖 Dashboard 和 Demo

## 待确认事项

后端反馈已写入 `docs/current-user-menu-feedback.md`，并同步到 `docs/API_INTEGRATION_TODOS.md`。

已确认规则：

- 后端菜单 `path` 保证和当前前端静态路由完全一致。
- 后端不返回 Dashboard 或 Demo 菜单。
- `menuType=LINK` 的外链需要在第一版侧边栏展示，前端按新窗口打开。
- `menuType=DIR` 有 `path` 但没有任何 `visible=1` 子菜单时，前端不展示该空目录。

当前无阻塞实现的待确认事项。实现中如发现 `externalUrl` 字段与实际响应不一致，再追加到 `docs/API_INTEGRATION_TODOS.md`。

## 验收标准

- 登录后会调用 `GET /api/auth/menus`
- 刷新页面恢复登录态后会重新获取菜单
- 退出登录或 401 后会清空用户菜单
- 侧边栏不再直接使用完整固定 `navItems`
- Dashboard 始终显示
- 页面示例 Demo 菜单始终显示
- 后端返回的 `visible=1` 菜单按 `sortOrder` 展示
- `visible=0` 菜单不展示
- `menuType=LINK` 菜单使用 `externalUrl` 并新窗口打开
- 无可见子菜单的 `DIR` 不展示
- 菜单图标根据后端 `icon` 映射，未知图标使用默认图标
- 面包屑能展示后端菜单标题
- 后端菜单为空或接口失败时后台仍可使用 Dashboard 和 Demo
- 不实现动态路由和动态 import
- 执行 `npm run build` 通过
- 执行 `npm run lint` 无新增 error

## 注意事项

- 本任务只动态化侧边栏菜单，不改变页面访问权限。
- 不要把后端菜单直接等同于权限守卫。
- 不要删除默认 Dashboard 和 Demo。
- 不要因为后端有 `component` 字段就引入动态路由框架。
- 如果菜单接口返回路径和现有路由不一致，优先记录 TODO，再做明确的静态别名补充。
