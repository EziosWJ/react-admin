# 字典使用经验

## 适用场景

当页面、表单、筛选项、状态标签需要字典选项时，优先使用后端字典接口，不要在页面里硬编码整组选项。

当前前端已有通用读取能力：

- `src/hooks/use-dict-options.ts`
- `src/constants/dicts.ts`
- `src/api/system.ts` 中的 `getDictItems(dictCode)`

## 使用原则

1. 页面需要字典项时，先确认字典 `code`。
2. 不要直接猜 `code`，也不要为了赶进度自己发明一个。
3. 字典项内容由后端维护，前端只保留必要的编码常量、协议值域和兜底选项。
4. 如果字典接口失败，页面仍应可用，必要时显示 toast 提示。
5. 如果后端返回了前端不认识的值，要过滤掉，不要放进表单或筛选项。

## 推荐用法

### 1. 先问字典 code

如果一个页面需要字典项，但上下文里没有明确说明 code，应先向用户确认：

- 这个字段对应哪个字典 `code`
- 是否需要兜底选项
- 是否是协议型字典，需要保留前端值域约束

### 2. 用通用 Hook 读取

推荐通过 `useDictOptions` 读取字典，再把结果传给页面下拉、筛选项或表单。

常见写法：

```ts
const statusDict = useDictOptions(DICT_CODES.COMMON_STATUS, {
  fallback: COMMON_STATUS_OPTIONS,
  valueType: "number",
  showErrorToast: true,
});
```

### 3. 只在 `dicts.ts` 放这些内容

- 字典编码常量
- 协议型值域
- 关键 fallback 选项

不要把每个字典项都写进 `dicts.ts`，否则会和后端字典管理重复。

## 参考页面

- 菜单管理：菜单类型、状态、可见性
- 用户管理：性别、状态
- 配置管理：配置类型、值类型、状态
- 文件管理：业务模块、状态
- 登录日志：日志状态
- 操作日志：操作类型、日志状态

## 页面执行提醒

如果你要开始做一个新页面，且页面里会用到字典项，第一步先确认字典 code，再决定是否需要 fallback 和值域约束。
