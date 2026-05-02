import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, RefreshCw, RotateCcw, Search, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useForm, type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import {
  createDept,
  deleteDept,
  deptOptionsToTreeSelectNodes,
  getDeptDetail,
  getDeptOptions,
  getDeptPage,
  updateDept,
  updateDeptStatus,
} from "@/api/dept";
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
import { TreeSelect } from "@/components/common/tree-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { isApiError } from "@/lib/api-error";
import type { ApiStatus, DataTableColumn, DeptOption, DeptRecord } from "@/types";

type FilterState = {
  deptName: string;
  deptCode: string;
  status: "all" | ApiStatus;
};

type DeptFormMode = "create" | "edit";

type ConfirmAction =
  | { type: "delete"; dept: DeptRecord }
  | { type: "status"; dept: DeptRecord; status: ApiStatus };

const DEFAULT_FILTERS: FilterState = {
  deptName: "",
  deptCode: "",
  status: "all",
};

const statusMeta: Record<ApiStatus, { label: string; tone: "success" | "neutral" }> = {
  1: { label: "启用", tone: "success" },
  0: { label: "禁用", tone: "neutral" },
};

const emptyToUndefined = (value: unknown) =>
  value === "" || value === null ? undefined : value;

const deptFormSchema = z.object({
  parentId: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int("上级部门 ID 必须是整数").min(0, "上级部门 ID 不能小于 0").optional(),
  ),
  deptName: z
    .string()
    .trim()
    .min(1, "部门名称不能为空")
    .max(64, "部门名称不能超过 64 个字符"),
  deptCode: z
    .string()
    .trim()
    .min(1, "部门编码不能为空")
    .max(64, "部门编码不能超过 64 个字符"),
  leader: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(32, "负责人不能超过 32 个字符").optional(),
  ),
  phone: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(20, "联系电话不能超过 20 个字符").optional(),
  ),
  email: z.preprocess(
    emptyToUndefined,
    z.string().trim().email("邮箱格式不正确").optional(),
  ),
  sortOrder: z.coerce.number().int("排序必须是整数").min(0, "排序不能小于 0"),
  status: z.coerce.number().pipe(z.union([z.literal(0), z.literal(1)])),
  remark: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(200, "备注不能超过 200 个字符").optional(),
  ),
});

type DeptFormValues = z.infer<typeof deptFormSchema>;

function getErrorMessage(error: unknown, fallback: string) {
  if (isApiError(error)) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

function buildQuery(filters: FilterState, page: number, pageSize: number) {
  return {
    page,
    pageSize,
    deptName: filters.deptName.trim() || undefined,
    deptCode: filters.deptCode.trim() || undefined,
    status: filters.status === "all" ? undefined : filters.status,
  };
}

function buildDeptPayload(values: DeptFormValues) {
  return {
    parentId: values.parentId ?? 0,
    deptName: values.deptName.trim(),
    deptCode: values.deptCode.trim(),
    leader: values.leader?.trim(),
    phone: values.phone?.trim(),
    email: values.email?.trim(),
    sortOrder: values.sortOrder,
    status: values.status,
    remark: values.remark?.trim(),
  };
}

function toFormValues(dept?: DeptRecord): DeptFormValues {
  return {
    parentId: dept?.parentId ?? undefined,
    deptName: dept?.deptName ?? "",
    deptCode: dept?.deptCode ?? "",
    leader: dept?.leader ?? "",
    phone: dept?.phone ?? "",
    email: dept?.email ?? "",
    sortOrder: dept?.sortOrder ?? 0,
    status: dept?.status === 0 ? 0 : 1,
    remark: dept?.remark ?? "",
  };
}

function collectDeptBranchIds(options: DeptOption[], targetId?: number | null) {
  if (!targetId) return [];

  const findBranch = (items: DeptOption[]): DeptOption | null => {
    for (const item of items) {
      if (item.id === targetId) return item;
      const matched = item.children?.length ? findBranch(item.children) : null;
      if (matched) return matched;
    }

    return null;
  };

  const collectIds = (item: DeptOption): number[] => [
    item.id,
    ...(item.children ?? []).flatMap(collectIds),
  ];

  const branch = findBranch(options);
  return branch ? collectIds(branch) : [targetId];
}

export function SystemDeptsPage() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<FilterState>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [depts, setDepts] = useState<DeptRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deptOptions, setDeptOptions] = useState<DeptOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<DeptFormMode>("create");
  const [editingDept, setEditingDept] = useState<DeptRecord | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const form = useForm<DeptFormValues>({
    resolver: zodResolver(deptFormSchema),
    defaultValues: toFormValues(),
  });

  const loadDepts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getDeptPage(buildQuery(appliedFilters, page, pageSize));
      setDepts(data.records);
      setTotal(data.total);
    } catch (loadError) {
      setDepts([]);
      setTotal(0);
      setError(getErrorMessage(loadError, "部门列表加载失败"));
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page, pageSize]);

  const loadDeptOptions = useCallback(async () => {
    setOptionsLoading(true);

    try {
      const data = await getDeptOptions();
      setDeptOptions(data);
    } catch (loadError) {
      setDeptOptions([]);
      toast.error({
        title: "部门树加载失败",
        description: getErrorMessage(loadError, "无法获取部门选择树"),
      });
    } finally {
      setOptionsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDepts();
  }, [loadDepts]);

  useEffect(() => {
    void loadDeptOptions();
  }, [loadDeptOptions]);

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
    setEditingDept(null);
    form.reset(toFormValues());
    setFormOpen(true);
    void loadDeptOptions();
  };

  const openEditForm = async (dept: DeptRecord) => {
    setFormMode("edit");
    setEditingDept(dept);
    form.reset(toFormValues(dept));
    setFormOpen(true);
    void loadDeptOptions();

    try {
      const detail = await getDeptDetail(dept.id);
      setEditingDept(detail);
      form.reset(toFormValues(detail));
    } catch (detailError) {
      toast.error({
        title: "部门详情加载失败",
        description: getErrorMessage(detailError, "无法获取部门详情"),
      });
    }
  };

  const submitDeptForm = async (values: DeptFormValues) => {
    setFormSubmitting(true);

    try {
      if (formMode === "edit" && editingDept) {
        await updateDept(editingDept.id, buildDeptPayload(values));
        toast.success("部门已更新");
      } else {
        await createDept(buildDeptPayload(values));
        toast.success("部门已创建");
      }

      setFormOpen(false);
      await Promise.all([loadDepts(), loadDeptOptions()]);
    } catch (submitError) {
      if (isApiError(submitError) && submitError.fieldErrors) {
        Object.entries(submitError.fieldErrors).forEach(([field, message]) => {
          form.setError(field as keyof DeptFormValues, { message });
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

  const runConfirmAction = async () => {
    if (!confirmAction) return;

    setConfirmLoading(true);
    try {
      if (confirmAction.type === "delete") {
        if (confirmAction.dept.isBuiltin === 1) {
          toast.warning("内置部门不允许删除");
          return;
        }

        await deleteDept(confirmAction.dept.id);
        toast.success("部门已删除");
      }

      if (confirmAction.type === "status") {
        await updateDeptStatus(confirmAction.dept.id, {
          status: confirmAction.status,
        });
        toast.success(
          confirmAction.status === 1 ? "部门已启用" : "部门已禁用",
        );
      }

      setConfirmAction(null);
      await Promise.all([loadDepts(), loadDeptOptions()]);
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
        title: "删除部门",
        description: `确认删除部门「${confirmAction.dept.deptName}」吗？此操作不可恢复。`,
        confirmText: "删除",
        danger: true,
      };
    }

    const enabled = confirmAction.status === 1;
    return {
      title: enabled ? "启用部门" : "禁用部门",
      description: `确认${enabled ? "启用" : "禁用"}部门「${confirmAction.dept.deptName}」吗？`,
      confirmText: enabled ? "启用" : "禁用",
      danger: !enabled,
    };
  }, [confirmAction]);

  const columns: DataTableColumn<DeptRecord>[] = [
    {
      title: "部门",
      key: "dept",
      width: 240,
      render: (_, dept) => (
        <div>
          <div className="font-medium text-text-primary">{dept.deptName}</div>
          <div className="text-xs text-text-tertiary">
            {dept.deptCode} · ID {dept.id}
          </div>
        </div>
      ),
    },
    {
      title: "负责人",
      dataIndex: "leader",
      width: 120,
      render: (value) => String(value || "-"),
    },
    {
      title: "联系方式",
      key: "contact",
      width: 220,
      render: (_, dept) => (
        <div className="space-y-0.5 text-sm">
          <div>{dept.phone || "-"}</div>
          <div className="text-xs text-text-tertiary">{dept.email || "-"}</div>
        </div>
      ),
    },
    {
      title: "排序",
      dataIndex: "sortOrder",
      width: 90,
      render: (value) => <span className="tabular-nums">{String(value ?? 0)}</span>,
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
      title: "操作",
      key: "actions",
      align: "center",
      width: 260,
      render: (_, dept) => (
        <div className="inline-flex flex-wrap items-center justify-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => openEditForm(dept)}>
            <Pencil className="h-4 w-4" aria-hidden />
            编辑
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              setConfirmAction({
                type: "status",
                dept,
                status: dept.status === 1 ? 0 : 1,
              })
            }
          >
            {dept.status === 1 ? "禁用" : "启用"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-error hover:text-error"
            disabled={dept.isBuiltin === 1}
            title={dept.isBuiltin === 1 ? "内置部门不允许删除" : undefined}
            onClick={() => setConfirmAction({ type: "delete", dept })}
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
        title="部门管理"
        description="维护组织部门、负责人、状态和排序。"
        actions={
          <Button variant="primary" onClick={openCreateForm}>
            <Plus className="h-4 w-4" aria-hidden />
            新建部门
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
            value={filters.deptName}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                deptName: event.target.value,
              }))
            }
            placeholder="部门名称"
          />
          <Input
            value={filters.deptCode}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                deptCode: event.target.value,
              }))
            }
            placeholder="部门编码"
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
          title="部门列表"
          description={`共 ${total} 条数据，当前显示 ${depts.length} 条。`}
          actions={
            <>
              <StatusTag tone={loading ? "warning" : error ? "error" : "info"}>
                {loading ? "加载中" : error ? "加载失败" : "已同步"}
              </StatusTag>
              <Button size="sm" variant="secondary" onClick={loadDepts}>
                <RefreshCw className="h-4 w-4" aria-hidden />
                刷新
              </Button>
            </>
          }
        />
        <DataTable<DeptRecord>
          columns={columns}
          dataSource={depts}
          rowKey="id"
          loading={loading}
          error={error}
          minWidth={1120}
          empty={
            <EmptyState
              title="暂无部门数据"
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

      <DeptFormDialog
        open={formOpen}
        mode={formMode}
        form={form}
        loading={formSubmitting}
        optionsLoading={optionsLoading}
        editingDept={editingDept}
        deptOptions={deptOptions}
        onCancel={() => setFormOpen(false)}
        onSubmit={submitDeptForm}
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

type DeptFormDialogProps = {
  open: boolean;
  mode: DeptFormMode;
  form: UseFormReturn<DeptFormValues>;
  loading: boolean;
  optionsLoading: boolean;
  editingDept: DeptRecord | null;
  deptOptions: DeptOption[];
  onCancel: () => void;
  onSubmit: (values: DeptFormValues) => void;
};

function DeptFormDialog({
  open,
  mode,
  form,
  loading,
  optionsLoading,
  editingDept,
  deptOptions,
  onCancel,
  onSubmit,
}: DeptFormDialogProps) {
  if (!open || typeof document === "undefined") return null;

  const {
    formState: { errors },
    handleSubmit,
    register,
    setValue,
    watch,
  } = form;

  const disabledParentIds = collectDeptBranchIds(deptOptions, editingDept?.id);
  const parentTreeNodes = deptOptionsToTreeSelectNodes(
    deptOptions,
    disabledParentIds,
  );
  const parentId = watch("parentId");
  const isBuiltin = editingDept?.isBuiltin === 1;

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
              {mode === "create" ? "新建部门" : "编辑部门"}
            </h2>
            <p className="mt-1 text-sm text-text-tertiary">
              {isBuiltin ? "内置部门编码不建议修改，已在表单中锁定。" : "维护部门基础信息和启用状态。"}
            </p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            disabled={loading}
            onClick={onCancel}
            aria-label="关闭部门表单"
          >
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </header>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid max-h-[calc(100vh-184px)] gap-4 overflow-y-auto px-5 py-4 md:grid-cols-2">
            <Field
              label="上级部门"
              error={errors.parentId?.message}
              help={optionsLoading ? "部门树加载中..." : "不选择时创建为顶级部门。"}
            >
              <TreeSelect
                value={parentId ?? null}
                nodes={parentTreeNodes}
                placeholder={optionsLoading ? "部门树加载中" : "请选择上级部门"}
                disabled={loading || optionsLoading}
                onChange={(value) => {
                  setValue("parentId", value == null ? undefined : Number(value), {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }}
              />
            </Field>
            <Field label="部门名称" error={errors.deptName?.message} required>
              <Input
                {...register("deptName")}
                placeholder="请输入部门名称"
                disabled={loading}
              />
            </Field>
            <Field label="部门编码" error={errors.deptCode?.message} required>
              <Input
                {...register("deptCode")}
                placeholder="请输入部门编码"
                disabled={loading || isBuiltin}
              />
            </Field>
            <Field label="负责人" error={errors.leader?.message}>
              <Input
                {...register("leader")}
                placeholder="请输入负责人"
                disabled={loading}
              />
            </Field>
            <Field label="联系电话" error={errors.phone?.message}>
              <Input
                {...register("phone")}
                placeholder="请输入联系电话"
                disabled={loading}
                autoComplete="tel"
              />
            </Field>
            <Field label="邮箱" error={errors.email?.message}>
              <Input
                {...register("email")}
                placeholder="请输入邮箱"
                disabled={loading}
                autoComplete="email"
              />
            </Field>
            <Field label="排序" error={errors.sortOrder?.message}>
              <Input
                {...register("sortOrder", { valueAsNumber: true })}
                type="number"
                min={0}
                placeholder="请输入排序"
                disabled={loading}
              />
            </Field>
            <Field label="状态" error={errors.status?.message}>
              <Select {...register("status", { valueAsNumber: true })} disabled={loading}>
                <option value={1}>启用</option>
                <option value={0}>禁用</option>
              </Select>
            </Field>
            <div className="md:col-span-2">
              <Field label="备注" error={errors.remark?.message}>
                <Textarea
                  {...register("remark")}
                  placeholder="请输入备注"
                  disabled={loading}
                />
              </Field>
            </div>
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
