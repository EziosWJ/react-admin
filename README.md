# React Admin Template

React 后台管理系统前端基础模板，使用 React、TypeScript、Vite、Tailwind CSS、React Router 和 Zustand 搭建。

## 运行命令

```bash
npm install
npm run dev
npm run build
```

## 表单能力

当前项目使用 `react-hook-form`、`zod` 和 `@hookform/resolvers` 作为统一表单方案。

### 绑定方式

普通原生输入型组件使用 `register` 绑定：

```tsx
<Input
  id="name"
  disabled={isSubmitting}
  {...register("name")}
/>
```

`Input`、`Select`、`Textarea` 保持原有调用方式，同时增加了 `forwardRef`，因此 `react-hook-form` 可以把字段 `ref` 透传到真实 DOM 控件上。这样不需要为基础输入组件新增专用表单 API。

自定义受控组件使用 `Controller` 绑定，例如 `Switch`：

```tsx
<Controller
  control={control}
  name="enabled"
  render={({ field }) => (
    <Switch
      checked={field.value}
      onCheckedChange={field.onChange}
      disabled={isSubmitting}
    />
  )}
/>
```

校验规则集中写在 Zod schema 中，并通过 `zodResolver` 接入 `useForm`：

```tsx
const form = useForm<FormValues>({
  resolver: zodResolver(formSchema),
  defaultValues,
  mode: "onBlur",
});
```

页面展示错误时继续复用现有 `Field` 组件：

```tsx
<Field label="配置名称" error={errors.name?.message}>
  <Input {...register("name")} />
</Field>
```

这个绑定方式的好处是：基础 UI 组件仍然只负责视觉和原生控件能力，表单状态、校验、提交 loading 和错误信息由 `react-hook-form` 与 `zod` 管理。
