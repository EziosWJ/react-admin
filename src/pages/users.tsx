import { zodResolver } from "@hookform/resolvers/zod";
import {
  KeyRound,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  assignUserRoles,
  createUser,
  deleteUser,
  getAssignableRoles,
  getUserDetail,
  getUserPage,
  resetUserPassword,
  updateUser,
  updateUserStatus,
} from "@/api/user";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { DataTable } from "@/components/common/data-table";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { Pagination } from "@/components/common/pagination";
import { SearchFilterBar } from "@/components/common/search-filter-bar";
import { StatusTag } from "@/components/common/status-tag";
import { TableToolbar } from "@/components/common/table-toolbar";
import { toast } from "@/components/common/toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDateOnly, formatDateTime } from "@/lib/datetime";
import { isApiError } from "@/lib/api-error";
import type {
  ApiStatus,
  AssignableRole,
  DataTableColumn,
  UserRecord,
} from "@/types";

type FilterState = {
  username: string;
  nickname: string;
  phone: string;
  email: string;
  status: "all" | ApiStatus;
  deptId: string;
};

type UserFormMode = "create" | "edit";

type ConfirmAction =
  | { type: "delete"; user: UserRecord }
  | { type: "status"; user: UserRecord; status: ApiStatus }
  | { type: "resetPassword"; user: UserRecord };

const DEFAULT_FILTERS: FilterState = {
  username: "",
  nickname: "",
  phone: "",
  email: "",
  status: "all",
  deptId: "",
};

const statusMeta: Record<ApiStatus, { label: string; tone: "success" | "neutral" }> = {
  1: { label: "启用", tone: "success" },
  0: { label: "禁用", tone: "neutral" },
};

const emptyToUndefined = (value: unknown) =>
  value === "" || value === null ? undefined : value;

const userFormSchema = z.object({
  username: z
    .string()
    .trim()
    .min(2, "用户名至少 2 个字符")
    .max(32, "用户名不能超过 32 个字符"),
  nickname: z
    .string()
    .trim()
    .min(1, "昵称不能为空")
    .max(32, "昵称不能超过 32 个字符"),
  phone: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(20, "手机号不能超过 20 个字符").optional(),
  ),
  email: z.preprocess(
    emptyToUndefined,
    z.string().trim().email("邮箱格式不正确").optional(),
  ),
  gender: z.enum(["MALE", "FEMALE", "UNKNOWN"]),
  deptId: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int("部门 ID 必须是整数").positive("部门 ID 必须大于 0").optional(),
  ),
  status: z.coerce.number().pipe(z.union([z.literal(0), z.literal(1)])),
  remark: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(200, "备注不能超过 200 个字符").optional(),
  ),
});

type UserFormValues = z.infer<typeof userFormSchema>;

function getErrorMessage(error: unknown, fallback: string) {
  if (isApiError(error)) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

function buildQuery(filters: FilterState, page: number, pageSize: number) {
  return {
    page,
    pageSize,
    username: filters.username.trim() || undefined,
    nickname: filters.nickname.trim() || undefined,
    phone: filters.phone.trim() || undefined,
    email: filters.email.trim() || undefined,
    status: filters.status === "all" ? undefined : filters.status,
    deptId: filters.deptId ? Number(filters.deptId) : undefined,
  };
}

function buildUserPayload(values: UserFormValues) {
  return {
    username: values.username.trim(),
    nickname: values.nickname.trim(),
    phone: values.phone?.trim(),
    email: values.email?.trim(),
    gender: values.gender,
    deptId: values.deptId,
    status: values.status,
    remark: values.remark?.trim(),
  };
}

function toFormValues(user?: UserRecord): UserFormValues {
  return {
    username: user?.username ?? "",
    nickname: user?.nickname ?? "",
    phone: user?.phone ?? "",
    email: user?.email ?? "",
    gender: user?.gender ?? "UNKNOWN",
    deptId: user?.deptId ?? undefined,
    status: user?.status === 0 ? 0 : 1,
    remark: user?.remark ?? "",
  };
}

function getRoleNames(user: UserRecord) {
  if (!user.roles?.length) return "-";
  return user.roles.map((role) => role.roleName).join("、");
}

export function UsersPage() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<FilterState>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<UserFormMode>("create");
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [roleDialogUser, setRoleDialogUser] = useState<UserRecord | null>(null);
  const [roleOptions, setRoleOptions] = useState<AssignableRole[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [roleLoading, setRoleLoading] = useState(false);
  const [roleSubmitting, setRoleSubmitting] = useState(false);
  const [resetPasswordResult, setResetPasswordResult] = useState<{
    user: UserRecord;
    password: string;
  } | null>(null);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: toFormValues(),
  });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getUserPage(buildQuery(appliedFilters, page, pageSize));
      setUsers(data.records);
      setTotal(data.total);
    } catch (loadError) {
      setUsers([]);
      setTotal(0);
      setError(getErrorMessage(loadError, "用户列表加载失败"));
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page, pageSize]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const submitFilters = (event?: React.FormEvent) => {
    event?.preventDefault();
    setPage(1);
    setAppliedFilters(filters);
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setPage(1);
  };

  const openCreateForm = () => {
    setFormMode("create");
    setEditingUser(null);
    form.reset(toFormValues());
    setFormOpen(true);
  };

  const openEditForm = async (user: UserRecord) => {
    setFormMode("edit");
    setEditingUser(user);
    form.reset(toFormValues(user));
    setFormOpen(true);

    try {
      const detail = await getUserDetail(user.id);
      setEditingUser(detail);
      form.reset(toFormValues(detail));
    } catch (detailError) {
      toast.error({
        title: "用户详情加载失败",
        description: getErrorMessage(detailError, "无法获取用户详情"),
      });
    }
  };

  const submitUserForm = async (values: UserFormValues) => {
    setFormSubmitting(true);

    try {
      if (formMode === "edit" && editingUser) {
        await updateUser(editingUser.id, buildUserPayload(values));
        toast.success("用户已更新");
      } else {
        await createUser(buildUserPayload(values));
        toast.success("用户已创建，默认密码为 admin123");
      }

      setFormOpen(false);
      await loadUsers();
    } catch (submitError) {
      if (isApiError(submitError) && submitError.fieldErrors) {
        Object.entries(submitError.fieldErrors).forEach(([field, message]) => {
          form.setError(field as keyof UserFormValues, { message });
        });
      }

      toast.error({
        title: formMode === "edit" ? "更新失败" : "创建失败",
        description: getErrorMessage(submitError, "请检查表单后重试"),
      });
    } finally {
      setFormSubmitting(false);
    }
  };

  const openRoleDialog = async (user: UserRecord) => {
    setRoleDialogUser(user);
    setSelectedRoleIds(user.roles?.map((role) => role.id) ?? []);
    setRoleLoading(true);

    try {
      const [detail, roles] = await Promise.all([
        getUserDetail(user.id),
        getAssignableRoles(),
      ]);
      setRoleDialogUser(detail);
      setSelectedRoleIds(detail.roles?.map((role) => role.id) ?? []);
      setRoleOptions(roles);
    } catch (roleError) {
      toast.error({
        title: "角色数据加载失败",
        description: getErrorMessage(roleError, "无法获取角色列表"),
      });
    } finally {
      setRoleLoading(false);
    }
  };

  const submitRoles = async () => {
    if (!roleDialogUser) return;

    setRoleSubmitting(true);
    try {
      await assignUserRoles(roleDialogUser.id, { roleIds: selectedRoleIds });
      toast.success("角色分配已保存");
      setRoleDialogUser(null);
      await loadUsers();
    } catch (roleError) {
      toast.error({
        title: "角色分配失败",
        description: getErrorMessage(roleError, "请稍后重试"),
      });
    } finally {
      setRoleSubmitting(false);
    }
  };

  const runConfirmAction = async () => {
    if (!confirmAction) return;

    setConfirmLoading(true);
    try {
      if (confirmAction.type === "delete") {
        await deleteUser(confirmAction.user.id);
        toast.success("用户已删除");
      }

      if (confirmAction.type === "status") {
        await updateUserStatus(confirmAction.user.id, {
          status: confirmAction.status,
        });
        toast.success(
          confirmAction.status === 1 ? "用户已启用" : "用户已禁用",
        );
      }

      if (confirmAction.type === "resetPassword") {
        const password = await resetUserPassword(confirmAction.user.id);
        setResetPasswordResult({ user: confirmAction.user, password });
        toast.success("密码已重置");
      }

      setConfirmAction(null);
      await loadUsers();
    } catch (actionError) {
      toast.error({
        title: "操作失败",
        description: getErrorMessage(actionError, "请稍后重试"),
      });
    } finally {
      setConfirmLoading(false);
    }
  };

  const confirmMeta = useMemo(() => {
    if (!confirmAction) return null;

    if (confirmAction.type === "delete") {
      return {
        title: "删除用户",
        description: `确认删除用户「${confirmAction.user.nickname || confirmAction.user.username}」吗？此操作不可恢复。`,
        confirmText: "删除",
        danger: true,
      };
    }

    if (confirmAction.type === "status") {
      const enabled = confirmAction.status === 1;
      return {
        title: enabled ? "启用用户" : "禁用用户",
        description: `确认${enabled ? "启用" : "禁用"}用户「${confirmAction.user.nickname || confirmAction.user.username}」吗？`,
        confirmText: enabled ? "启用" : "禁用",
        danger: !enabled,
      };
    }

    return {
      title: "重置密码",
      description: `确认重置用户「${confirmAction.user.nickname || confirmAction.user.username}」的密码吗？新密码将返回给管理员。`,
      confirmText: "重置密码",
      danger: false,
    };
  }, [confirmAction]);

  const columns: DataTableColumn<UserRecord>[] = [
    {
      title: "用户",
      key: "user",
      width: 220,
      render: (_, user) => (
        <div>
          <div className="font-medium text-text-primary">
            {user.nickname || user.username}
          </div>
          <div className="text-xs text-text-tertiary">
            {user.username} · ID {user.id}
          </div>
        </div>
      ),
    },
    {
      title: "联系方式",
      key: "contact",
      width: 220,
      render: (_, user) => (
        <div className="space-y-0.5 text-sm">
          <div>{user.phone || "-"}</div>
          <div className="text-xs text-text-tertiary">{user.email || "-"}</div>
        </div>
      ),
    },
    {
      title: "部门",
      dataIndex: "deptName",
      render: (value) => String(value || "-"),
    },
    {
      title: "角色",
      key: "roles",
      width: 220,
      render: (_, user) => (
        <span className="line-clamp-2 text-sm">{getRoleNames(user)}</span>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 96,
      render: (value) => {
        const status = value as ApiStatus;
        const meta = statusMeta[status];
        return <StatusTag tone={meta.tone}>{meta.label}</StatusTag>;
      },
    },
    {
      title: "最近登录",
      dataIndex: "lastLoginTime",
      width: 180,
      render: (value) => (
        <span className="whitespace-nowrap tabular-nums">
          {formatDateTime(typeof value === "string" ? value : value ? String(value) : "")}
        </span>
      ),
    },
    {
      title: "创建时间",
      dataIndex: "createTime",
      width: 180,
      render: (value) => (
        <span className="whitespace-nowrap tabular-nums">
          {formatDateOnly(typeof value === "string" ? value : value ? String(value) : "")}
        </span>
      ),
    },
    {
      title: "操作",
      key: "actions",
      align: "center",
      width: 340,
      render: (_, user) => (
        <div className="inline-flex flex-wrap items-center justify-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => openEditForm(user)}>
            <Pencil className="h-4 w-4" aria-hidden />
            编辑
          </Button>
          <Button size="sm" variant="ghost" onClick={() => openRoleDialog(user)}>
            <ShieldCheck className="h-4 w-4" aria-hidden />
            角色
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              setConfirmAction({
                type: "status",
                user,
                status: user.status === 1 ? 0 : 1,
              })
            }
          >
            {user.status === 1 ? "禁用" : "启用"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setConfirmAction({ type: "resetPassword", user })}
          >
            <KeyRound className="h-4 w-4" aria-hidden />
            重置
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-error hover:text-error"
            onClick={() => setConfirmAction({ type: "delete", user })}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            删除
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="用户管理"
        description="管理后台用户、状态、角色和密码重置。"
        actions={
          <Button variant="primary" onClick={openCreateForm}>
            <Plus className="h-4 w-4" aria-hidden />
            新建用户
          </Button>
        }
      />

      <SearchFilterBar
        actions={
          <>
            <Button variant="secondary" onClick={resetFilters}>
              <RotateCcw className="h-4 w-4" aria-hidden />
              重置
            </Button>
            <Button variant="primary" onClick={() => submitFilters()}>
              <Search className="h-4 w-4" aria-hidden />
              查询
            </Button>
          </>
        }
      >
        <form
          className="contents"
          onSubmit={(event) => submitFilters(event)}
        >
          <Input
            value={filters.username}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                username: event.target.value,
              }))
            }
            placeholder="用户名"
          />
          <Input
            value={filters.nickname}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                nickname: event.target.value,
              }))
            }
            placeholder="昵称"
          />
          <Input
            value={filters.phone}
            onChange={(event) =>
              setFilters((current) => ({ ...current, phone: event.target.value }))
            }
            placeholder="手机号"
          />
          <Input
            value={filters.email}
            onChange={(event) =>
              setFilters((current) => ({ ...current, email: event.target.value }))
            }
            placeholder="邮箱"
          />
          <Input
            value={filters.deptId}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                deptId: event.target.value,
              }))
            }
            placeholder="部门 ID"
            inputMode="numeric"
          />
          <Select
            value={String(filters.status)}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                status:
                  event.target.value === "all"
                    ? "all"
                    : (Number(event.target.value) as ApiStatus),
              }))
            }
            aria-label="筛选状态"
          >
            <option value="all">全部状态</option>
            <option value="1">启用</option>
            <option value="0">禁用</option>
          </Select>
        </form>
      </SearchFilterBar>

      <section className="rounded-admin border border-border bg-surface shadow-admin">
        <TableToolbar
          title="用户列表"
          description={`共 ${total} 条数据，当前显示 ${users.length} 条。`}
          actions={
            <>
              <StatusTag tone={loading ? "warning" : error ? "error" : "info"}>
                {loading ? "加载中" : error ? "加载失败" : "已同步"}
              </StatusTag>
              <Button size="sm" variant="secondary" onClick={loadUsers}>
                <RefreshCw className="h-4 w-4" aria-hidden />
                刷新
              </Button>
            </>
          }
        />
        <DataTable<UserRecord>
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          error={error}
          minWidth={1280}
          empty={
            <EmptyState
              title="暂无用户数据"
              description="调整筛选条件后重新查询。"
              actionText="重置筛选"
              onAction={resetFilters}
            />
          }
        />
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          disabled={loading}
          onPageChange={setPage}
          onPageSizeChange={(nextPageSize) => {
            setPageSize(nextPageSize);
            setPage(1);
          }}
        />
      </section>

      <UserFormDialog
        open={formOpen}
        mode={formMode}
        form={form}
        loading={formSubmitting}
        onCancel={() => setFormOpen(false)}
        onSubmit={submitUserForm}
      />

      <RoleAssignDialog
        user={roleDialogUser}
        roles={roleOptions}
        selectedRoleIds={selectedRoleIds}
        loading={roleLoading}
        submitting={roleSubmitting}
        onToggle={(roleId, checked) => {
          setSelectedRoleIds((current) =>
            checked
              ? Array.from(new Set([...current, roleId]))
              : current.filter((id) => id !== roleId),
          );
        }}
        onCancel={() => setRoleDialogUser(null)}
        onSubmit={submitRoles}
      />

      <PasswordResultDialog
        result={resetPasswordResult}
        onClose={() => setResetPasswordResult(null)}
      />

      {confirmMeta && (
        <ConfirmDialog
          open={!!confirmAction}
          title={confirmMeta.title}
          description={confirmMeta.description}
          confirmText={confirmMeta.confirmText}
          danger={confirmMeta.danger}
          loading={confirmLoading}
          onConfirm={runConfirmAction}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </>
  );
}

type UserFormDialogProps = {
  open: boolean;
  mode: UserFormMode;
  form: ReturnType<typeof useForm<UserFormValues>>;
  loading: boolean;
  onCancel: () => void;
  onSubmit: (values: UserFormValues) => void;
};

function UserFormDialog({
  open,
  mode,
  form,
  loading,
  onCancel,
  onSubmit,
}: UserFormDialogProps) {
  if (!open || typeof document === "undefined") return null;

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = form;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 px-4 py-6">
      <section
        className="max-h-[calc(100vh-48px)] w-full max-w-[760px] overflow-hidden rounded-admin border border-border bg-surface shadow-admin"
        role="dialog"
        aria-modal="true"
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-text-primary">
              {mode === "create" ? "新建用户" : "编辑用户"}
            </h2>
            <p className="mt-1 text-sm text-text-tertiary">
              新增用户默认密码由后端生成，当前部门暂以部门 ID 输入占位。
            </p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            disabled={loading}
            onClick={onCancel}
            aria-label="关闭用户表单"
          >
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </header>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid max-h-[calc(100vh-184px)] gap-4 overflow-y-auto px-5 py-4 md:grid-cols-2">
            <FormField label="用户名" error={errors.username?.message} required>
              <Input
                {...register("username")}
                placeholder="请输入用户名"
                disabled={loading}
                autoComplete="username"
              />
            </FormField>
            <FormField label="昵称" error={errors.nickname?.message} required>
              <Input
                {...register("nickname")}
                placeholder="请输入昵称"
                disabled={loading}
              />
            </FormField>
            <FormField label="手机号" error={errors.phone?.message}>
              <Input
                {...register("phone")}
                placeholder="请输入手机号"
                disabled={loading}
                autoComplete="tel"
              />
            </FormField>
            <FormField label="邮箱" error={errors.email?.message}>
              <Input
                {...register("email")}
                placeholder="请输入邮箱"
                disabled={loading}
                autoComplete="email"
              />
            </FormField>
            <FormField label="性别" error={errors.gender?.message}>
              <Select {...register("gender")} disabled={loading}>
                <option value="UNKNOWN">未知</option>
                <option value="MALE">男</option>
                <option value="FEMALE">女</option>
              </Select>
            </FormField>
            <FormField label="状态" error={errors.status?.message}>
              <Select {...register("status", { valueAsNumber: true })} disabled={loading}>
                <option value={1}>启用</option>
                <option value={0}>禁用</option>
              </Select>
            </FormField>
            <FormField label="部门 ID" error={errors.deptId?.message}>
              <Input
                {...register("deptId", {
                  setValueAs: (value) =>
                    value === "" ? undefined : Number(value),
                })}
                placeholder="部门模块完成后替换为树选择"
                disabled={loading}
                inputMode="numeric"
              />
            </FormField>
            <FormField
              label="备注"
              error={errors.remark?.message}
              className="md:col-span-2"
            >
              <Textarea
                {...register("remark")}
                placeholder="请输入备注"
                disabled={loading}
              />
            </FormField>
          </div>
          <footer className="flex justify-end gap-2 border-t border-border px-5 py-4">
            <Button variant="secondary" disabled={loading} onClick={onCancel}>
              取消
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className={loading ? "cursor-wait" : undefined}
            >
              {loading ? "提交中..." : "保存"}
            </Button>
          </footer>
        </form>
      </section>
    </div>,
    document.body,
  );
}

type RoleAssignDialogProps = {
  user: UserRecord | null;
  roles: AssignableRole[];
  selectedRoleIds: number[];
  loading: boolean;
  submitting: boolean;
  onToggle: (roleId: number, checked: boolean) => void;
  onCancel: () => void;
  onSubmit: () => void;
};

function RoleAssignDialog({
  user,
  roles,
  selectedRoleIds,
  loading,
  submitting,
  onToggle,
  onCancel,
  onSubmit,
}: RoleAssignDialogProps) {
  if (!user || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 px-4 py-6">
      <section
        className="w-full max-w-[560px] rounded-admin border border-border bg-surface shadow-admin"
        role="dialog"
        aria-modal="true"
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-text-primary">
              分配角色
            </h2>
            <p className="mt-1 text-sm text-text-tertiary">
              {user.nickname || user.username}
            </p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            disabled={submitting}
            onClick={onCancel}
            aria-label="关闭角色分配"
          >
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </header>

        <div className="max-h-[360px] overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-10 animate-pulse rounded-lg bg-slate-100"
                />
              ))}
            </div>
          ) : roles.length === 0 ? (
            <EmptyState
              title="暂无可分配角色"
              description="后端角色列表为空或当前筛选无启用角色。"
            />
          ) : (
            <div className="space-y-2">
              {roles.map((role) => (
                <label
                  key={role.id}
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 hover:bg-slate-50"
                >
                  <span>
                    <span className="font-medium text-text-primary">
                      {role.roleName}
                    </span>
                    <span className="ml-2 text-xs text-text-tertiary">
                      {role.roleCode}
                    </span>
                  </span>
                  <Checkbox
                    checked={selectedRoleIds.includes(role.id)}
                    disabled={submitting}
                    onChange={(event) => onToggle(role.id, event.target.checked)}
                  />
                </label>
              ))}
            </div>
          )}
        </div>

        <footer className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <Button variant="secondary" disabled={submitting} onClick={onCancel}>
            取消
          </Button>
          <Button
            variant="primary"
            disabled={loading || submitting}
            onClick={onSubmit}
          >
            {submitting ? "保存中..." : "保存"}
          </Button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}

function PasswordResultDialog({
  result,
  onClose,
}: {
  result: { user: UserRecord; password: string } | null;
  onClose: () => void;
}) {
  if (!result || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 px-4 py-6">
      <section
        className="w-full max-w-[480px] rounded-admin border border-border bg-surface shadow-admin"
        role="dialog"
        aria-modal="true"
      >
        <header className="border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold text-text-primary">
            密码重置成功
          </h2>
          <p className="mt-1 text-sm text-text-tertiary">
            请将新密码线下通知用户「{result.user.nickname || result.user.username}」。
          </p>
        </header>
        <div className="px-5 py-4">
          <div className="rounded-lg border border-border bg-slate-50 px-4 py-3 font-mono text-lg font-semibold tabular-nums text-text-primary">
            {String(result.password)}
          </div>
        </div>
        <footer className="flex justify-end px-5 py-4">
          <Button variant="primary" onClick={onClose}>
            知道了
          </Button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}

function FormField({
  label,
  error,
  required = false,
  className,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={className}>
      <span className="mb-1.5 block text-sm font-medium text-text-primary">
        {label}
        {required && <span className="ml-1 text-error">*</span>}
      </span>
      {children}
      <span className="mt-1 block min-h-[18px] text-xs text-error">
        {error ?? ""}
      </span>
    </label>
  );
}
