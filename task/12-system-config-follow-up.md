# 任务 12：系统配置模块确认与迁移

## 目标

确认后端是否提供系统配置接口，并根据确认结果决定保留 mock、隐藏入口或迁移到真实接口。

## 参考文档

- `docs/BACKEND_INTEGRATION_CHECKLIST.md`
- `docs/frontend-api-guide.md`

## 背景

当前前端已有：

- `src/pages/system-configs.tsx`
- `src/api/system.ts` 中配置相关 mock API
- `src/types/system.ts` 中配置类型

但 `docs/frontend-api-guide.md` 未列出系统配置接口。

## 负责范围

主要负责：

- `src/pages/system-configs.tsx`
- `src/api/system.ts` 中配置相关方法
- `src/types/system.ts` 中配置相关类型
- `src/config/navigation.ts`，仅在需要隐藏入口时修改
- `docs/BACKEND_INTEGRATION_CHECKLIST.md`，如后端补充协议后同步更新

避免修改：

- 字典管理接口
- 用户、角色、菜单、部门模块

## 任务步骤

1. 向后端确认是否已有系统配置接口。
2. 如果后端已有接口：
   - 补充接口路径和字段协议
   - 改造 `system-configs` 页面接真实分页
   - 补新增、编辑、删除、启停能力
3. 如果后端暂未提供：
   - 页面继续保留 mock，并明确标注当前未接真实接口
   - 或从导航中临时隐藏入口
4. 不要自行设计后端不存在的接口路径。

## 验收标准

- 系统配置模块状态明确
- 如果迁移真实接口，执行 `npm run build` 通过
- 如果保留 mock，文档和页面说明一致

## 注意事项

- 该任务依赖后端补充信息，不适合作为第一批并行开发任务。
