import { zodResolver } from "@hookform/resolvers/zod";
import {
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useForm, type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import {
  batchDeleteSystemConfigs,
  createSystemConfig,
  deleteSystemConfig,
  getDictItems,
  getSystemConfigDetail,
  getSystemConfigPage,
  updateSystemConfig,
  updateSystemConfigStatus,
} from "@/api/system";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { DataTable } from "@/components/common/data-table";
import { EmptyState } from "@/components/common/empty-state";
import { Field } from "@/components/common/field";
import { PageHeader } from "@/components/common/page-header";
import { Pagination } from "@/components/common/pagination";
import { SearchFilterBar } from "@/components/common/search-filter-bar";
import { StatusTag } from "@/components/common/status-tag";
import { TableToolbar } from "@/components/common/table-toolbar";
import { toast } from "@/components/common/toast-store";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { isApiError } from "@/lib/api-error";
import { formatDateTime } from "@/lib/datetime";
import { cn } from "@/lib/utils";
import type {
  ApiStatus,
  DataTableColumn,
  DictOption,
  SystemConfigRecord,
  SystemConfigType,
  SystemConfigValueType,
} from "@/types";

type FilterState = {
  configName: string;
  configKey: string;
  configType: "all" | SystemConfigType;
  status: "all" | ApiStatus;
};

type FormMode = "create" | "edit";

type SelectOption<T extends string> = {
  label: string;
  value: T;
};

type ConfirmAction =
  | { type: "delete"; config: SystemConfigRecord }
  | { type: "batchDelete"; configs: SystemConfigRecord[] }
  | { type: "status"; config: SystemConfigRecord; status: ApiStatus };

const DEFAULT_FILTERS: FilterState = {
  configName: "",
  configKey: "",
  configType: "all",
  status: "all",
};

const fallbackConfigTypeOptions: Array<SelectOption<SystemConfigType>> = [
  { label: "系统配置", value: "SYSTEM" },
  { label: "自定义配置", value: "CUSTOM" },
];

const fallbackValueTypeOptions: Array<SelectOption<SystemConfigValueType>> = [
  { label: "文本", value: "TEXT" },
  { label: "数字", value: "NUMBER" },
  { label: "布尔", value: "BOOLEAN" },
];

const statusMeta: Record<ApiStatus, { label: string; tone: "success" | "neutral" }> = {
  1: { label: "启用", tone: "success" },
  0: { label: "禁用", tone: "neutral" },
};

const emptyToUndefined = (value: unknown) =>
  value === "" || value === null ? undefined : value;

const configFormSchema = z
  .object({
    configName: z
      .string()
      .trim()
      .min(1, "配置名称不能为空")
      .max(100, "配置名称不能超过 100 个字符"),
    configKey: z
      .string()
      .trim()
      .min(1, "配置键不能为空")
      .max(100, "配置键不能超过 100 个字符"),
    configValue: z.string().max(500, "配置值不能超过 500 个字符"),
    configType: z.enum(["SYSTEM", "CUSTOM"]),
    valueType: z.enum(["TEXT", "NUMBER", "BOOLEAN"]),
    status: z.coerce.number().pipe(z.union([z.literal(0), z.literal(1)])),
    remark: z.preprocess(
      emptyToUndefined,
      z.string().trim().max(200, "备注不能超过 200 个字符").optional(),
    ),
  })
  .superRefine((values, context) => {
    const value = values.configValue.trim();

    if (values.valueType === "NUMBER" && value && !Number.isFinite(Number(value))) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["configValue"],
        message: "数字类型的配置值必须是合法数字",
      });
    }

    if (
      values.valueType === "BOOLEAN" &&
      value !== "true" &&
      value !== "false"
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["configValue"],
        message: "布尔类型的配置值必须为 true 或 false",
      });
    }
  });

type ConfigFormValues = z.infer<typeof configFormSchema>;

function getErrorMessage(error: unknown, fallback: string) {
  if (isApiError(error)) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

function isSystemConfigType(value: string): value is SystemConfigType {
  return value === "SYSTEM" || value === "CUSTOM";
}

function isSystemConfigValueType(value: string): value is SystemConfigValueType {
  return value === "TEXT" || value === "NUMBER" || value === "BOOLEAN";
}

function dictOptionsToSelectOptions<T extends string>(
  items: DictOption[],
  isValue: (value: string) => value is T,
  fallback: Array<SelectOption<T>>,
) {
  const options = items
    .filter((item) => isValue(item.value))
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => ({ label: item.label, value: item.value as T }));

  return options.length > 0 ? options : fallback;
}

function buildQuery(filters: FilterState, page: number, pageSize: number) {
  return {
    page,
    pageSize,
    configName: filters.configName.trim() || undefined,
    configKey: filters.configKey.trim() || undefined,
    configType: filters.configType === "all" ? undefined : filters.configType,
    status: filters.status === "all" ? undefined : filters.status,
  };
}

function getConfigStatus(config?: Pick<SystemConfigRecord, "status">): ApiStatus {
  return config?.status === 0 || config?.status === "disabled" ? 0 : 1;
}

function isBuiltinConfig(config: SystemConfigRecord) {
  return config.isBuiltin === 1;
}

function getConfigTypeLabel(
  value: SystemConfigType | undefined,
  options: Array<SelectOption<SystemConfigType>>,
) {
  return options.find((item) => item.value === value)?.label ?? value ?? "-";
}

function getValueTypeLabel(
  value: SystemConfigValueType | undefined,
  options: Array<SelectOption<SystemConfigValueType>>,
) {
  return options.find((item) => item.value === value)?.label ?? value ?? "-";
}

function toFormValues(config?: SystemConfigRecord): ConfigFormValues {
  const valueType = config?.valueType ?? "TEXT";
  const configValue = config?.configValue ?? "";

  return {
    configName: config?.configName ?? "",
    configKey: config?.configKey ?? "",
    configValue:
      valueType === "BOOLEAN" && configValue !== "true" && configValue !== "false"
        ? "false"
        : configValue,
    configType: config?.configType ?? "SYSTEM",
    valueType,
    status: getConfigStatus(config),
    remark: config?.remark ?? "",
  };
}

function buildPayload(values: ConfigFormValues) {
  const normalizedValue =
    values.valueType === "TEXT" ? values.configValue : values.configValue.trim();

  return {
    configName: values.configName.trim(),
    configKey: values.configKey.trim(),
    configValue:
      values.valueType === "BOOLEAN" ? normalizedValue.toLowerCase() : normalizedValue,
    configType: values.configType,
    valueType: values.valueType,
    status: values.status,
    remark: values.remark?.trim(),
  };
}

export function SystemConfigsPage() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<FilterState>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [configs, setConfigs] = useState<SystemConfigRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [configTypeOptions, setConfigTypeOptions] = useState(
    fallbackConfigTypeOptions,
  );
  const [valueTypeOptions, setValueTypeOptions] = useState(
    fallbackValueTypeOptions,
  );
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editingConfig, setEditingConfig] = useState<SystemConfigRecord | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const form = useForm<ConfigFormValues>({
    resolver: zodResolver(configFormSchema),
    defaultValues: toFormValues(),
  });

  const loadConfigs = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getSystemConfigPage(
        buildQuery(appliedFilters, page, pageSize),
      );
      setConfigs(data.records);
      setTotal(data.total);
      setSelectedIds((current) => {
        const nextRecordIds = new Set(data.records.map((item) => item.id));
        return new Set([...current].filter((id) => nextRecordIds.has(id)));
      });
    } catch (loadError) {
      setConfigs([]);
      setTotal(0);
      setSelectedIds(new Set());
      setError(getErrorMessage(loadError, "配置列表加载失败"));
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page, pageSize]);

  useEffect(() => {
    void loadConfigs();
  }, [loadConfigs]);

  useEffect(() => {
    let ignore = false;

    async function loadOptions() {
      try {
        const [configTypes, valueTypes] = await Promise.all([
          getDictItems("CONFIG_TYPE"),
          getDictItems("CONFIG_VALUE_TYPE"),
        ]);

        if (ignore) return;

        setConfigTypeOptions(
          dictOptionsToSelectOptions(
            configTypes,
            isSystemConfigType,
            fallbackConfigTypeOptions,
          ),
        );
        setValueTypeOptions(
          dictOptionsToSelectOptions(
            valueTypes,
            isSystemConfigValueType,
            fallbackValueTypeOptions,
          ),
        );
      } catch {
        if (ignore) return;
        setConfigTypeOptions(fallbackConfigTypeOptions);
        setValueTypeOptions(fallbackValueTypeOptions);
      }
    }

    void loadOptions();
    return () => {
      ignore = true;
    };
  }, []);

  const selectableIds = useMemo(
    () => configs.filter((item) => !isBuiltinConfig(item)).map((item) => item.id),
    [configs],
  );
  const allSelectableChecked =
    selectableIds.length > 0 && selectableIds.every((id) => selectedIds.has(id));
  const selectedConfigs = useMemo(
    () =>
      configs.filter((item) => selectedIds.has(item.id) && !isBuiltinConfig(item)),
    [configs, selectedIds],
  );

  const submitFilters = (event?: FormEvent) => {
    event?.preventDefault();
    setPage(1);
    setAppliedFilters(filters);
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setPage(1);
  };

  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);

      selectableIds.forEach((id) => {
        if (checked) {
          next.add(id);
        } else {
          next.delete(id);
        }
      });

      return next;
    });
  };

  const toggleSelect = (id: number, checked: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const openCreateForm = () => {
    setFormMode("create");
    setEditingConfig(null);
    form.reset(toFormValues());
    setFormOpen(true);
  };

  const openEditForm = async (config: SystemConfigRecord) => {
    if (isBuiltinConfig(config)) {
      toast.warning("内置配置不允许编辑");
      return;
    }

    setFormMode("edit");
    setEditingConfig(config);
    form.reset(toFormValues(config));
    setFormOpen(true);

    try {
      const detail = await getSystemConfigDetail(config.id);
      setEditingConfig(detail);
      form.reset(toFormValues(detail));
    } catch (detailError) {
      toast.error({
        title: "配置详情加载失败",
        description: getErrorMessage(detailError, "无法获取配置详情"),
      });
    }
  };

  const submitForm = async (values: ConfigFormValues) => {
    setSubmitting(true);

    try {
      if (formMode === "edit" && editingConfig) {
        await updateSystemConfig(editingConfig.id, buildPayload(values));
        toast.success("配置已更新");
      } else {
        await createSystemConfig(buildPayload(values));
        toast.success("配置已创建");
      }

      setFormOpen(false);
      await loadConfigs();
    } catch (submitError) {
      if (isApiError(submitError) && submitError.fieldErrors) {
        Object.entries(submitError.fieldErrors).forEach(([field, message]) => {
          form.setError(field as keyof ConfigFormValues, { message });
        });
      }

      toast.error({
        title: formMode === "edit" ? "更新失败" : "创建失败",
        description: getErrorMessage(submitError, "请检查表单后重试"),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const runConfirmAction = async () => {
    if (!confirmAction) return;

    setConfirmLoading(true);

    try {
      if (confirmAction.type === "delete") {
        if (isBuiltinConfig(confirmAction.config)) {
          toast.warning("内置配置不允许删除");
          return;
        }

        await deleteSystemConfig(confirmAction.config.id);
        toast.success("配置已删除");
      }

      if (confirmAction.type === "batchDelete") {
        await batchDeleteSystemConfigs({
          ids: confirmAction.configs.map((item) => item.id),
        });
        toast.success("配置已批量删除");
      }

      if (confirmAction.type === "status") {
        await updateSystemConfigStatus(confirmAction.config.id, {
          status: confirmAction.status,
        });
        toast.success(confirmAction.status === 1 ? "配置已启用" : "配置已禁用");
      }

      setConfirmAction(null);
      setSelectedIds(new Set());
      await loadConfigs();
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
        title: "删除配置",
        description: `确认删除配置「${confirmAction.config.configName ?? "-"}」吗？此操作不可恢复。`,
        confirmText: "删除",
        danger: true,
      };
    }

    if (confirmAction.type === "batchDelete") {
      return {
        title: "批量删除配置",
        description: `确认删除已选择的 ${confirmAction.configs.length} 个普通配置吗？内置配置不会被选中。`,
        confirmText: "批量删除",
        danger: true,
      };
    }

    const enabled = confirmAction.status === 1;
    return {
      title: enabled ? "启用配置" : "禁用配置",
      description: `确认${enabled ? "启用" : "禁用"}配置「${confirmAction.config.configName ?? "-"}」吗？`,
      confirmText: enabled ? "启用" : "禁用",
      danger: !enabled,
    };
  }, [confirmAction]);

  const columns: DataTableColumn<SystemConfigRecord>[] = [
    {
      title: (
        <Checkbox
          aria-label="选择当前页普通配置"
          checked={allSelectableChecked}
          disabled={selectableIds.length === 0}
          onChange={(event) => toggleSelectAll(event.target.checked)}
        />
      ),
      key: "selection",
      align: "center",
      width: 54,
      render: (_, record) => {
        const disabled = isBuiltinConfig(record);
        return (
          <Checkbox
            aria-label={`选择配置 ${record.configName ?? record.id}`}
            checked={selectedIds.has(record.id)}
            disabled={disabled}
            title={disabled ? "内置配置不参与批量删除" : undefined}
            onChange={(event) => toggleSelect(record.id, event.target.checked)}
          />
        );
      },
    },
    {
      title: "配置名称",
      key: "configName",
      width: 240,
      render: (_, record) => (
        <div>
          <div className="font-medium text-text-primary">
            {record.configName ?? "-"}
          </div>
          <div className="text-xs text-text-tertiary">
            ID {record.id} · {record.configKey ?? "-"}
          </div>
        </div>
      ),
    },
    {
      title: "配置键",
      dataIndex: "configKey",
      width: 240,
      render: (value) => (
        <span className="block max-w-[240px] truncate font-mono text-[13px] text-text-secondary">
          {String(value || "-")}
        </span>
      ),
    },
    {
      title: "配置值",
      dataIndex: "configValue",
      width: 220,
      render: (value) => (
        <span className="block max-w-[220px] truncate text-text-secondary">
          {String(value ?? "-")}
        </span>
      ),
    },
    {
      title: "配置类型",
      dataIndex: "configType",
      width: 120,
      render: (value) =>
        getConfigTypeLabel(value as SystemConfigType | undefined, configTypeOptions),
    },
    {
      title: "值类型",
      dataIndex: "valueType",
      width: 100,
      render: (value) =>
        getValueTypeLabel(
          value as SystemConfigValueType | undefined,
          valueTypeOptions,
        ),
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 96,
      render: (_, record) => {
        const status = getConfigStatus(record);
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
      title: "更新时间",
      key: "updateTime",
      width: 180,
      render: (_, record) => (
        <span className="whitespace-nowrap tabular-nums">
          {formatDateTime(record.updateTime ?? record.createTime)}
        </span>
      ),
    },
    {
      title: "操作",
      key: "actions",
      align: "center",
      width: 260,
      render: (_, record) => {
        const builtin = isBuiltinConfig(record);
        const nextStatus = getConfigStatus(record) === 1 ? 0 : 1;

        return (
          <div className="inline-flex flex-wrap items-center justify-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              disabled={builtin}
              title={builtin ? "内置配置不允许编辑" : undefined}
              onClick={() => void openEditForm(record)}
            >
              <Pencil className="h-4 w-4" aria-hidden />
              编辑
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={builtin}
              title={builtin ? "内置配置不提供启停操作" : undefined}
              onClick={() =>
                setConfirmAction({
                  type: "status",
                  config: record,
                  status: nextStatus,
                })
              }
            >
              {nextStatus === 1 ? "启用" : "禁用"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-error hover:text-error"
              disabled={builtin}
              title={builtin ? "内置配置不允许删除" : undefined}
              onClick={() => setConfirmAction({ type: "delete", config: record })}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              删除
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="配置管理"
        description="维护系统级和自定义配置项，支持分页查询、配置值类型校验和启停管理。"
        actions={
          <Button variant="primary" onClick={openCreateForm}>
            <Plus className="h-4 w-4" aria-hidden />
            新增配置
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
        <form className="contents" onSubmit={submitFilters}>
          <Input
            value={filters.configName}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                configName: event.target.value,
              }))
            }
            placeholder="配置名称"
          />
          <Input
            value={filters.configKey}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                configKey: event.target.value,
              }))
            }
            placeholder="配置键"
          />
          <Select
            value={filters.configType}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                configType: event.target.value as FilterState["configType"],
              }))
            }
            aria-label="筛选配置类型"
          >
            <option value="all">全部类型</option>
            {configTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
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
          title="配置项列表"
          description={`共 ${total} 条数据，当前显示 ${configs.length} 条。`}
          actions={
            <>
              <StatusTag tone={loading ? "warning" : error ? "error" : "info"}>
                {loading ? "加载中" : error ? "加载失败" : "已同步"}
              </StatusTag>
              <Button size="sm" variant="secondary" onClick={loadConfigs}>
                <RefreshCw className="h-4 w-4" aria-hidden />
                刷新
              </Button>
              <Button
                size="sm"
                variant="danger"
                disabled={selectedConfigs.length === 0}
                onClick={() =>
                  setConfirmAction({
                    type: "batchDelete",
                    configs: selectedConfigs,
                  })
                }
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                批量删除
              </Button>
            </>
          }
        />
        <DataTable<SystemConfigRecord>
          columns={columns}
          dataSource={configs}
          rowKey="id"
          loading={loading}
          error={error}
          minWidth={1440}
          empty={
            <EmptyState
              title="暂无配置项"
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

      <ConfigFormDialog
        open={formOpen}
        mode={formMode}
        form={form}
        loading={submitting}
        editingConfig={editingConfig}
        configTypeOptions={configTypeOptions}
        valueTypeOptions={valueTypeOptions}
        onCancel={() => setFormOpen(false)}
        onSubmit={submitForm}
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

type ConfigFormDialogProps = {
  open: boolean;
  mode: FormMode;
  form: UseFormReturn<ConfigFormValues>;
  loading: boolean;
  editingConfig: SystemConfigRecord | null;
  configTypeOptions: Array<SelectOption<SystemConfigType>>;
  valueTypeOptions: Array<SelectOption<SystemConfigValueType>>;
  onCancel: () => void;
  onSubmit: (values: ConfigFormValues) => void;
};

function ConfigFormDialog({
  open,
  mode,
  form,
  loading,
  editingConfig,
  configTypeOptions,
  valueTypeOptions,
  onCancel,
  onSubmit,
}: ConfigFormDialogProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    setValue,
    watch,
  } = form;
  const valueType = watch("valueType");
  const readonlyKey = mode === "edit";

  useEffect(() => {
    if (!open || valueType !== "BOOLEAN") return;

    const currentValue = form.getValues("configValue").trim().toLowerCase();
    if (currentValue !== "true" && currentValue !== "false") {
      setValue("configValue", "false", { shouldValidate: true });
    }
  }, [form, open, setValue, valueType]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 px-4 py-6">
      <section
        className="max-h-[calc(100vh-48px)] w-full max-w-[720px] overflow-hidden rounded-admin border border-border bg-surface shadow-admin"
        role="dialog"
        aria-modal="true"
        aria-labelledby="config-form-title"
      >
        <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <h2
              id="config-form-title"
              className="text-base font-semibold text-text-primary"
            >
              {mode === "edit" ? "编辑配置" : "新增配置"}
            </h2>
            <p className="mt-1 text-[13px] text-text-tertiary">
              编辑时配置键不可修改，但会随请求体提交给后端校验。
            </p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0"
            disabled={loading}
            onClick={onCancel}
            aria-label="关闭配置表单"
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
              label="配置名称"
              htmlFor="configName"
              required
              error={errors.configName?.message}
            >
              <Input
                id="configName"
                disabled={loading}
                placeholder="例如：系统名称"
                {...register("configName")}
              />
            </Field>

            <Field
              label="配置键"
              htmlFor="configKey"
              required
              error={errors.configKey?.message}
              help={readonlyKey ? "配置键修改会影响调用方，编辑时固定。" : undefined}
            >
              <Input
                id="configKey"
                disabled={loading}
                readOnly={readonlyKey}
                className={cn(readonlyKey && "bg-slate-50 text-text-tertiary")}
                placeholder="例如：system.name"
                {...register("configKey")}
              />
            </Field>

            <Field
              label="配置类型"
              htmlFor="configType"
              error={errors.configType?.message}
            >
              <Select id="configType" disabled={loading} {...register("configType")}>
                {configTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="值类型"
              htmlFor="valueType"
              error={errors.valueType?.message}
            >
              <Select id="valueType" disabled={loading} {...register("valueType")}>
                {valueTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="状态" htmlFor="status" error={errors.status?.message}>
              <Select id="status" disabled={loading} {...register("status")}>
                <option value="1">启用</option>
                <option value="0">禁用</option>
              </Select>
            </Field>

            <Field
              label="配置值"
              htmlFor="configValue"
              error={errors.configValue?.message}
            >
              {valueType === "BOOLEAN" ? (
                <Select
                  id="configValue"
                  disabled={loading}
                  {...register("configValue")}
                >
                  <option value="true">true</option>
                  <option value="false">false</option>
                </Select>
              ) : (
                <Input
                  id="configValue"
                  type={valueType === "NUMBER" ? "number" : "text"}
                  inputMode={valueType === "NUMBER" ? "decimal" : undefined}
                  disabled={loading}
                  placeholder={valueType === "NUMBER" ? "例如：10" : "配置值"}
                  {...register("configValue")}
                />
              )}
            </Field>
          </div>

          <div className="mt-4">
            <Field label="备注" htmlFor="remark" error={errors.remark?.message}>
              <Textarea
                id="remark"
                disabled={loading}
                placeholder="补充配置用途或维护说明"
                {...register("remark")}
              />
            </Field>
          </div>

          {mode === "edit" && editingConfig?.isBuiltin === 1 && (
            <div className="mt-4 rounded-admin border border-border bg-slate-50 px-4 py-3 text-sm text-text-secondary">
              内置配置由系统维护，不允许编辑或删除。
            </div>
          )}

          <footer className="mt-5 flex justify-end gap-2 border-t border-border pt-4">
            <Button variant="secondary" disabled={loading} onClick={onCancel}>
              取消
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={loading || editingConfig?.isBuiltin === 1}
            >
              {loading ? "保存中..." : "保存"}
            </Button>
          </footer>
        </form>
      </section>
    </div>,
    document.body,
  );
}
