import { zodResolver } from "@hookform/resolvers/zod";
import {
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
import { useForm, type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import {
  assignRoleMenus,
  createRole,
  deleteRole,
  getRoleDetail,
  getRolePage,
  getSystemMenuTree,
  updateRole,
  updateRoleStatus,
} from "@/api/rbac";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { DataTable } from "@/components/common/data-table";
import { EmptyState } from "@/components/common/empty-state";
import { Field } from "@/components/common/field";
import { PageHeader } from "@/components/common/page-header";
import { Pagination } from "@/components/common/pagination";
import { SearchFilterBar } from "@/components/common/search-filter-bar";
import { StatusTag } from "@/components/common/status-tag";
import { TableToolbar } from "@/components/common/table-toolbar";
import { toast } from "@/components/common/toast";
import {
  TreeCheckList,
  type TreeCheckNode,
} from "@/components/common/tree-check-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDateOnly } from "@/lib/datetime";
import { isApiError } from "@/lib/api-error";
import type {
  ApiStatus,
  DataTableColumn,
  RoleDetailRecord,
  RoleListRecord,
  SystemMenuTreeRecord,
} from "@/types";

type FilterState = {
  roleName: string;
  roleCode: string;
  status: "all" | ApiStatus;
};

type RoleFormMode = "create" | "edit";

type ConfirmAction =
  | { type: "delete"; role: RoleListRecord }
  | { type: "status"; role: RoleListRecord; status: ApiStatus };

const DEFAULT_FILTERS: FilterState = {
  roleName: "",
  roleCode: "",
  status: "all",
};

const statusMeta: Record<ApiStatus, { label: string; tone: "success" | "neutral" }> = {
  1: { label: "启用", tone: "success" },
  0: { label: "禁用", tone: "neutral" },
};

const emptyToUndefined = (value: unknown) =>
  value === "" || value === null ? undefined : value;

const roleFormSchema = z.object({
  roleName: z
    .string()
    .trim()
    .min(1, "角色名称不能为空")
    .max(64, "角色名称不能超过 64 个字符"),
  roleCode: z
    .string()
    .trim()
    .min(1, "角色编码不能为空")
    .max(64, "角色编码不能超过 64 个字符"),
  status: z.coerce.number().pipe(z.union([z.literal(0), z.literal(1)])),
  sortOrder: z.coerce.number().int("排序必须是整数").min(0, "排序不能小于 0"),
  remark: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(200, "备注不能超过 200 个字符").optional(),
  ),
});

type RoleFormValues = z.infer<typeof roleFormSchema>;

function getErrorMessage(error: unknown, fallback: string) {
  if (isApiError(error)) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

function buildQuery(filters: FilterState, page: number, pageSize: number) {
  return {
    page,
    pageSize,
    roleName: filters.roleName.trim() || undefined,
    roleCode: filters.roleCode.trim() || undefined,
    status: filters.status === "all" ? undefined : filters.status,
  };
}

function buildRolePayload(values: RoleFormValues) {
  return {
    roleName: values.roleName.trim(),
    roleCode: values.roleCode.trim(),
    status: values.status,
    sortOrder: values.sortOrder,
    remark: values.remark?.trim(),
  };
}

function toFormValues(role?: RoleListRecord): RoleFormValues {
  return {
    roleName: role?.roleName ?? "",
    roleCode: role?.roleCode ?? "",
    status: role?.status === 0 ? 0 : 1,
    sortOrder: role?.sortOrder ?? 0,
    remark: role?.remark ?? "",
  };
}

function menuTypeLabel(type: SystemMenuTreeRecord["menuType"]) {
  const labels: Record<SystemMenuTreeRecord["menuType"], string> = {
    DIR: "目录",
    MENU: "菜单",
    LINK: "外链",
  };

  return labels[type];
}

function menuTreeToCheckNodes(items: SystemMenuTreeRecord[]): TreeCheckNode[] {
  return items.map((item) => ({
    id: item.id,
    label: `${item.menuName} / ${menuTypeLabel(item.menuType)}${
      item.permissionCode ? ` / ${item.permissionCode}` : ""
    }`,
    disabled: item.status === 0,
    children: item.children?.length
      ? menuTreeToCheckNodes(item.children)
      : undefined,
  }));
}

function normalizeCheckedIds(ids: Array<string | number>) {
  return ids
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0);
}

export function SystemRolesPage() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<FilterState>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [roles, setRoles] = useState<RoleListRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<RoleFormMode>("create");
  const [editingRole, setEditingRole] = useState<RoleListRecord | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [assignmentRole, setAssignmentRole] = useState<RoleDetailRecord | null>(
    null,
  );
  const [menuTree, setMenuTree] = useState<SystemMenuTreeRecord[]>([]);
  const [selectedMenuIds, setSelectedMenuIds] = useState<number[]>([]);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [assignmentSubmitting, setAssignmentSubmitting] = useState(false);

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: toFormValues(),
  });

  const loadRoles = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getRolePage(buildQuery(appliedFilters, page, pageSize));
      setRoles(data.records);
      setTotal(data.total);
    } catch (loadError) {
      setRoles([]);
      setTotal(0);
      setError(getErrorMessage(loadError, "角色列表加载失败"));
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page, pageSize]);

  useEffect(() => {
    void loadRoles();
  }, [loadRoles]);

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
    setEditingRole(null);
    form.reset(toFormValues());
    setFormOpen(true);
  };

  const openEditForm = async (role: RoleListRecord) => {
    setFormMode("edit");
    setEditingRole(role);
    form.reset(toFormValues(role));
    setFormOpen(true);

    try {
      const detail = await getRoleDetail(role.id);
      setEditingRole(detail);
      form.reset(toFormValues(detail));
    } catch (detailError) {
      toast.error({
        title: "角色详情加载失败",
        description: getErrorMessage(detailError, "无法获取角色详情"),
      });
    }
  };

  const submitRoleForm = async (values: RoleFormValues) => {
    setFormSubmitting(true);

    try {
      if (formMode === "edit" && editingRole) {
        await updateRole(editingRole.id, buildRolePayload(values));
        toast.success("角色已更新");
      } else {
        await createRole(buildRolePayload(values));
        toast.success("角色已创建");
      }

      setFormOpen(false);
      await loadRoles();
    } catch (submitError) {
      if (isApiError(submitError) && submitError.fieldErrors) {
        Object.entries(submitError.fieldErrors).forEach(([field, message]) => {
          form.setError(field as keyof RoleFormValues, { message });
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

  const openAssignment = async (role: RoleListRecord) => {
    setAssignmentRole({ ...role, menuIds: [] });
    setMenuTree([]);
    setSelectedMenuIds([]);
    setAssignmentLoading(true);

    try {
      const [detail, menus] = await Promise.all([
        getRoleDetail(role.id),
        getSystemMenuTree(),
      ]);
      setAssignmentRole(detail);
      setMenuTree(menus);
      setSelectedMenuIds(detail.menuIds ?? []);
    } catch (loadError) {
      toast.error({
        title: "菜单权限加载失败",
        description: getErrorMessage(loadError, "无法获取角色菜单信息"),
      });
    } finally {
      setAssignmentLoading(false);
    }
  };

  const closeAssignment = () => {
    setAssignmentRole(null);
    setMenuTree([]);
    setSelectedMenuIds([]);
  };

  const submitAssignment = async () => {
    if (!assignmentRole) return;

    setAssignmentSubmitting(true);

    try {
      await assignRoleMenus(assignmentRole.id, { menuIds: selectedMenuIds });
      toast.success("菜单权限已保存");
      closeAssignment();
    } catch (submitError) {
      toast.error({
        title: "保存失败",
        description: getErrorMessage(submitError, "请稍后重试"),
      });
    } finally {
      setAssignmentSubmitting(false);
    }
  };

  const runConfirmAction = async () => {
    if (!confirmAction) return;

    setConfirmLoading(true);
    try {
      if (confirmAction.type === "delete") {
        if (confirmAction.role.isBuiltin === 1) {
          toast.warning("内置角色不允许删除");
          return;
        }

        await deleteRole(confirmAction.role.id);
        toast.success("角色已删除");
      }

      if (confirmAction.type === "status") {
        await updateRoleStatus(confirmAction.role.id, {
          status: confirmAction.status,
        });
        toast.success(
          confirmAction.status === 1 ? "角色已启用" : "角色已禁用",
        );
      }

      setConfirmAction(null);
      await loadRoles();
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
        title: "删除角色",
        description: `确认删除角色「${confirmAction.role.roleName}」吗？此操作不可恢复。`,
        confirmText: "删除",
        danger: true,
      };
    }

    const enabled = confirmAction.status === 1;
    return {
      title: enabled ? "启用角色" : "禁用角色",
      description: `确认${enabled ? "启用" : "禁用"}角色「${confirmAction.role.roleName}」吗？`,
      confirmText: enabled ? "启用" : "禁用",
      danger: !enabled,
    };
  }, [confirmAction]);

  const menuNodes = useMemo(() => menuTreeToCheckNodes(menuTree), [menuTree]);

  const columns: DataTableColumn<RoleListRecord>[] = [
    {
      title: "角色名称",
      key: "role",
      width: 240,
      render: (_, role) => (
        <div>
          <div className="font-medium text-text-primary">{role.roleName}</div>
          <div className="text-xs text-text-tertiary">
            {role.roleCode} · ID {role.id}
          </div>
        </div>
      ),
    },
    {
      title: "角色编码",
      dataIndex: "roleCode",
      width: 180,
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
      title: "属性",
      dataIndex: "isBuiltin",
      width: 96,
      render: (value) =>
        value === 1 ? (
          <StatusTag tone="info">内置</StatusTag>
        ) : (
          <StatusTag tone="neutral">普通</StatusTag>
        ),
    },
    {
      title: "排序",
      dataIndex: "sortOrder",
      align: "center",
      width: 90,
      render: (value) => <span className="tabular-nums">{String(value ?? 0)}</span>,
    },
    {
      title: "备注",
      dataIndex: "remark",
      width: 220,
      render: (value) => (
        <span className="block max-w-[220px] truncate text-text-secondary">
          {String(value || "-")}
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
      width: 320,
      render: (_, role) => (
        <div className="inline-flex flex-wrap items-center justify-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => void openEditForm(role)}>
            <Pencil className="h-4 w-4" aria-hidden />
            编辑
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => void openAssignment(role)}
          >
            <ShieldCheck className="h-4 w-4" aria-hidden />
            分配菜单
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              setConfirmAction({
                type: "status",
                role,
                status: role.status === 1 ? 0 : 1,
              })
            }
          >
            {role.status === 1 ? "禁用" : "启用"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-error hover:text-error"
            disabled={role.isBuiltin === 1}
            title={role.isBuiltin === 1 ? "内置角色不允许删除" : undefined}
            onClick={() => setConfirmAction({ type: "delete", role })}
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
        title="角色管理"
        description="维护系统角色、状态和菜单权限分配。"
        actions={
          <Button variant="primary" onClick={openCreateForm}>
            <Plus className="h-4 w-4" aria-hidden />
            新建角色
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
        <form className="contents" onSubmit={(event) => submitFilters(event)}>
          <Input
            value={filters.roleName}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                roleName: event.target.value,
              }))
            }
            placeholder="角色名称"
          />
          <Input
            value={filters.roleCode}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                roleCode: event.target.value,
              }))
            }
            placeholder="角色编码"
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
          title="角色列表"
          description={`共 ${total} 条数据，当前显示 ${roles.length} 条。`}
          actions={
            <>
              <StatusTag tone={loading ? "warning" : error ? "error" : "info"}>
                {loading ? "加载中" : error ? "加载失败" : "已同步"}
              </StatusTag>
              <Button size="sm" variant="secondary" onClick={loadRoles}>
                <RefreshCw className="h-4 w-4" aria-hidden />
                刷新
              </Button>
            </>
          }
        />
        <DataTable<RoleListRecord>
          columns={columns}
          dataSource={roles}
          rowKey="id"
          loading={loading}
          error={error}
          minWidth={1320}
          empty={
            <EmptyState
              title="暂无角色数据"
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

      <RoleFormDialog
        open={formOpen}
        mode={formMode}
        form={form}
        loading={formSubmitting}
        editingRole={editingRole}
        onCancel={() => setFormOpen(false)}
        onSubmit={submitRoleForm}
      />

      <RoleMenuAssignDialog
        role={assignmentRole}
        nodes={menuNodes}
        checkedIds={selectedMenuIds}
        loading={assignmentLoading}
        submitting={assignmentSubmitting}
        onCheckedChange={(ids) => setSelectedMenuIds(normalizeCheckedIds(ids))}
        onCancel={closeAssignment}
        onSubmit={submitAssignment}
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

type RoleFormDialogProps = {
  open: boolean;
  mode: RoleFormMode;
  form: UseFormReturn<RoleFormValues>;
  loading: boolean;
  editingRole: RoleListRecord | null;
  onCancel: () => void;
  onSubmit: (values: RoleFormValues) => void;
};

function RoleFormDialog({
  open,
  mode,
  form,
  loading,
  editingRole,
  onCancel,
  onSubmit,
}: RoleFormDialogProps) {
  if (!open || typeof document === "undefined") return null;

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = form;
  const isBuiltin = mode === "edit" && editingRole?.isBuiltin === 1;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 px-4 py-6">
      <section
        className="max-h-[calc(100vh-48px)] w-full max-w-[640px] overflow-hidden rounded-admin border border-border bg-surface shadow-admin"
        role="dialog"
        aria-modal="true"
        aria-labelledby="role-form-title"
      >
        <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <h2
              id="role-form-title"
              className="text-base font-semibold text-text-primary"
            >
              {mode === "edit" ? "编辑角色" : "新建角色"}
            </h2>
            <p className="mt-1 text-[13px] text-text-tertiary">
              内置角色的角色编码不可修改。
            </p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0"
            disabled={loading}
            onClick={onCancel}
            aria-label="关闭角色表单"
          >
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </header>

        <form
          className="max-h-[calc(100vh-150px)] overflow-y-auto px-5 py-5"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="角色名称"
              htmlFor="roleName"
              required
              error={errors.roleName?.message}
            >
              <Input
                id="roleName"
                disabled={loading}
                placeholder="例如：运营管理员"
                {...register("roleName")}
              />
            </Field>

            <Field
              label="角色编码"
              htmlFor="roleCode"
              required
              error={errors.roleCode?.message}
              help={isBuiltin ? "内置角色编码由系统维护。" : undefined}
            >
              <Input
                id="roleCode"
                disabled={loading}
                readOnly={isBuiltin}
                className={isBuiltin ? "bg-slate-50 text-text-tertiary" : undefined}
                placeholder="例如：operation_admin"
                {...register("roleCode")}
              />
            </Field>

            <Field label="状态" htmlFor="status" error={errors.status?.message}>
              <Select id="status" disabled={loading} {...register("status")}>
                <option value="1">启用</option>
                <option value="0">禁用</option>
              </Select>
            </Field>

            <Field
              label="排序"
              htmlFor="sortOrder"
              error={errors.sortOrder?.message}
            >
              <Input
                id="sortOrder"
                type="number"
                min={0}
                inputMode="numeric"
                disabled={loading}
                {...register("sortOrder")}
              />
            </Field>
          </div>

          <div className="mt-4">
            <Field label="备注" htmlFor="remark" error={errors.remark?.message}>
              <Textarea
                id="remark"
                disabled={loading}
                placeholder="补充角色用途或管理说明"
                {...register("remark")}
              />
            </Field>
          </div>

          <footer className="mt-5 flex justify-end gap-2 border-t border-border pt-4">
            <Button variant="secondary" disabled={loading} onClick={onCancel}>
              取消
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? "保存中..." : "保存"}
            </Button>
          </footer>
        </form>
      </section>
    </div>,
    document.body,
  );
}

type RoleMenuAssignDialogProps = {
  role: RoleDetailRecord | null;
  nodes: TreeCheckNode[];
  checkedIds: number[];
  loading: boolean;
  submitting: boolean;
  onCheckedChange: (checkedIds: Array<string | number>) => void;
  onCancel: () => void;
  onSubmit: () => void;
};

function RoleMenuAssignDialog({
  role,
  nodes,
  checkedIds,
  loading,
  submitting,
  onCheckedChange,
  onCancel,
  onSubmit,
}: RoleMenuAssignDialogProps) {
  if (!role || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 px-4 py-6">
      <section
        className="max-h-[calc(100vh-48px)] w-full max-w-[720px] overflow-hidden rounded-admin border border-border bg-surface shadow-admin"
        role="dialog"
        aria-modal="true"
        aria-labelledby="role-menu-title"
      >
        <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <h2
              id="role-menu-title"
              className="text-base font-semibold text-text-primary"
            >
              分配菜单
            </h2>
            <p className="mt-1 text-[13px] text-text-tertiary">
              {role.roleName} / {role.roleCode}
            </p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0"
            disabled={loading || submitting}
            onClick={onCancel}
            aria-label="关闭菜单分配"
          >
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </header>

        <div className="max-h-[calc(100vh-180px)] overflow-y-auto px-5 py-5">
          <div className="mb-3 flex items-center justify-between gap-3 text-sm">
            <span className="text-text-secondary">
              已选择{" "}
              <span className="font-medium text-text-primary">
                {checkedIds.length}
              </span>{" "}
              个菜单节点
            </span>
            <StatusTag tone={loading ? "warning" : "info"}>
              {loading ? "加载中" : "菜单树"}
            </StatusTag>
          </div>

          {loading ? (
            <div className="space-y-3">
              <div className="h-9 animate-pulse rounded-lg bg-slate-100" />
              <div className="h-9 animate-pulse rounded-lg bg-slate-100" />
              <div className="h-9 animate-pulse rounded-lg bg-slate-100" />
            </div>
          ) : (
            <TreeCheckList
              nodes={nodes}
              checkedIds={checkedIds}
              disabled={submitting}
              cascade
              onCheckedChange={onCheckedChange}
            />
          )}
        </div>

        <footer className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <Button
            variant="secondary"
            disabled={loading || submitting}
            onClick={onCancel}
          >
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
