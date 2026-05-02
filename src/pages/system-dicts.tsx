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
  createDictData,
  createDictType,
  deleteDictData,
  deleteDictType,
  getDictDataPage,
  getDictTypeDetail,
  getDictTypePage,
  updateDictData,
  updateDictType,
  updateDictTypeStatus,
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
import { toast } from "@/components/common/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDateOnly } from "@/lib/datetime";
import { isApiError } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import type {
  ApiStatus,
  DataTableColumn,
  SystemDictDataRecord,
  SystemDictTypeRecord,
} from "@/types";

type TypeFilterState = {
  dictName: string;
  dictCode: string;
  status: "all" | ApiStatus;
};

type ItemFilterState = {
  dictLabel: string;
  dictValue: string;
};

type FormMode = "create" | "edit";

type ConfirmAction =
  | { type: "deleteType"; dictType: SystemDictTypeRecord }
  | { type: "status"; dictType: SystemDictTypeRecord; status: ApiStatus }
  | { type: "deleteData"; dictData: SystemDictDataRecord };

const DEFAULT_TYPE_FILTERS: TypeFilterState = {
  dictName: "",
  dictCode: "",
  status: "all",
};

const DEFAULT_ITEM_FILTERS: ItemFilterState = {
  dictLabel: "",
  dictValue: "",
};

const statusMeta: Record<ApiStatus, { label: string; tone: "success" | "neutral" }> = {
  1: { label: "启用", tone: "success" },
  0: { label: "禁用", tone: "neutral" },
};

const emptyToUndefined = (value: unknown) =>
  value === "" || value === null ? undefined : value;

const dictTypeFormSchema = z.object({
  dictName: z
    .string()
    .trim()
    .min(1, "字典名称不能为空")
    .max(64, "字典名称不能超过 64 个字符"),
  dictCode: z
    .string()
    .trim()
    .min(1, "字典编码不能为空")
    .max(64, "字典编码不能超过 64 个字符"),
  status: z.coerce.number().pipe(z.union([z.literal(0), z.literal(1)])),
  sortOrder: z.coerce.number().int("排序必须是整数").min(0, "排序不能小于 0"),
  remark: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(200, "备注不能超过 200 个字符").optional(),
  ),
});

const dictDataFormSchema = z.object({
  dictLabel: z
    .string()
    .trim()
    .min(1, "字典项名称不能为空")
    .max(64, "字典项名称不能超过 64 个字符"),
  dictValue: z
    .string()
    .trim()
    .min(1, "字典项值不能为空")
    .max(128, "字典项值不能超过 128 个字符"),
  sortOrder: z.coerce.number().int("排序必须是整数").min(0, "排序不能小于 0"),
  remark: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(200, "备注不能超过 200 个字符").optional(),
  ),
});

type DictTypeFormValues = z.infer<typeof dictTypeFormSchema>;
type DictDataFormValues = z.infer<typeof dictDataFormSchema>;

function getErrorMessage(error: unknown, fallback: string) {
  if (isApiError(error)) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

function buildTypeQuery(filters: TypeFilterState, page: number, pageSize: number) {
  return {
    page,
    pageSize,
    dictName: filters.dictName.trim() || undefined,
    dictCode: filters.dictCode.trim() || undefined,
    status: filters.status === "all" ? undefined : filters.status,
  };
}

function buildDataQuery(
  filters: ItemFilterState,
  dictTypeId: number | null,
  page: number,
  pageSize: number,
) {
  return {
    page,
    pageSize,
    dictTypeId: dictTypeId ?? undefined,
    dictLabel: filters.dictLabel.trim() || undefined,
    dictValue: filters.dictValue.trim() || undefined,
  };
}

function toTypeFormValues(dictType?: SystemDictTypeRecord): DictTypeFormValues {
  return {
    dictName: dictType?.dictName ?? "",
    dictCode: dictType?.dictCode ?? "",
    status: dictType?.status === 0 ? 0 : 1,
    sortOrder: dictType?.sortOrder ?? 0,
    remark: dictType?.remark ?? "",
  };
}

function toDataFormValues(dictData?: SystemDictDataRecord): DictDataFormValues {
  return {
    dictLabel: dictData?.dictLabel ?? "",
    dictValue: dictData?.dictValue ?? "",
    sortOrder: dictData?.sortOrder ?? 0,
    remark: dictData?.remark ?? "",
  };
}

function buildTypePayload(values: DictTypeFormValues) {
  return {
    dictName: values.dictName.trim(),
    dictCode: values.dictCode.trim(),
    status: values.status,
    sortOrder: values.sortOrder,
    remark: values.remark?.trim(),
  };
}

function buildDataPayload(values: DictDataFormValues, dictTypeId: number) {
  return {
    dictTypeId,
    dictLabel: values.dictLabel.trim(),
    dictValue: values.dictValue.trim(),
    sortOrder: values.sortOrder,
    remark: values.remark?.trim(),
  };
}

export function SystemDictsPage() {
  const [typeFilters, setTypeFilters] =
    useState<TypeFilterState>(DEFAULT_TYPE_FILTERS);
  const [appliedTypeFilters, setAppliedTypeFilters] =
    useState<TypeFilterState>(DEFAULT_TYPE_FILTERS);
  const [itemFilters, setItemFilters] =
    useState<ItemFilterState>(DEFAULT_ITEM_FILTERS);
  const [appliedItemFilters, setAppliedItemFilters] =
    useState<ItemFilterState>(DEFAULT_ITEM_FILTERS);
  const [typePage, setTypePage] = useState(1);
  const [typePageSize, setTypePageSize] = useState(10);
  const [itemPage, setItemPage] = useState(1);
  const [itemPageSize, setItemPageSize] = useState(10);
  const [dictTypes, setDictTypes] = useState<SystemDictTypeRecord[]>([]);
  const [dictItems, setDictItems] = useState<SystemDictDataRecord[]>([]);
  const [typeTotal, setTypeTotal] = useState(0);
  const [itemTotal, setItemTotal] = useState(0);
  const [activeType, setActiveType] = useState<SystemDictTypeRecord | null>(
    null,
  );
  const [typeLoading, setTypeLoading] = useState(false);
  const [itemLoading, setItemLoading] = useState(false);
  const [typeError, setTypeError] = useState("");
  const [itemError, setItemError] = useState("");
  const [typeFormOpen, setTypeFormOpen] = useState(false);
  const [typeFormMode, setTypeFormMode] = useState<FormMode>("create");
  const [editingType, setEditingType] = useState<SystemDictTypeRecord | null>(
    null,
  );
  const [typeSubmitting, setTypeSubmitting] = useState(false);
  const [dataFormOpen, setDataFormOpen] = useState(false);
  const [dataFormMode, setDataFormMode] = useState<FormMode>("create");
  const [editingData, setEditingData] = useState<SystemDictDataRecord | null>(
    null,
  );
  const [dataSubmitting, setDataSubmitting] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const typeForm = useForm<DictTypeFormValues>({
    resolver: zodResolver(dictTypeFormSchema),
    defaultValues: toTypeFormValues(),
  });
  const dataForm = useForm<DictDataFormValues>({
    resolver: zodResolver(dictDataFormSchema),
    defaultValues: toDataFormValues(),
  });

  const selectedType = activeType;
  const selectedTypeId = activeType?.id ?? null;

  const loadDictTypes = useCallback(async () => {
    setTypeLoading(true);
    setTypeError("");

    try {
      const data = await getDictTypePage(
        buildTypeQuery(appliedTypeFilters, typePage, typePageSize),
      );
      setDictTypes(data.records);
      setTypeTotal(data.total);
      setActiveType((current) => {
        if (!current) return current;

        const next = data.records.find((item) => item.id === current.id);
        return next ?? current;
      });
    } catch (loadError) {
      setDictTypes([]);
      setTypeTotal(0);
      setTypeError(getErrorMessage(loadError, "字典类型加载失败"));
    } finally {
      setTypeLoading(false);
    }
  }, [appliedTypeFilters, typePage, typePageSize]);

  const loadDictItems = useCallback(async () => {
    if (!selectedTypeId) {
      setDictItems([]);
      setItemTotal(0);
      return;
    }

    setItemLoading(true);
    setItemError("");

    try {
      const data = await getDictDataPage(
        buildDataQuery(appliedItemFilters, selectedTypeId, itemPage, itemPageSize),
      );
      setDictItems(data.records);
      setItemTotal(data.total);
    } catch (loadError) {
      setDictItems([]);
      setItemTotal(0);
      setItemError(getErrorMessage(loadError, "字典项加载失败"));
    } finally {
      setItemLoading(false);
    }
  }, [appliedItemFilters, itemPage, itemPageSize, selectedTypeId]);

  useEffect(() => {
    void loadDictTypes();
  }, [loadDictTypes]);

  useEffect(() => {
    void loadDictItems();
  }, [loadDictItems]);

  const submitTypeFilters = (event?: FormEvent) => {
    event?.preventDefault();
    setTypePage(1);
    setAppliedTypeFilters(typeFilters);
  };

  const resetTypeFilters = () => {
    setTypeFilters(DEFAULT_TYPE_FILTERS);
    setAppliedTypeFilters(DEFAULT_TYPE_FILTERS);
    setTypePage(1);
  };

  const submitItemFilters = (event?: FormEvent) => {
    event?.preventDefault();
    setItemPage(1);
    setAppliedItemFilters(itemFilters);
  };

  const resetItemFilters = () => {
    setItemFilters(DEFAULT_ITEM_FILTERS);
    setAppliedItemFilters(DEFAULT_ITEM_FILTERS);
    setItemPage(1);
  };

  const selectType = (dictType: SystemDictTypeRecord) => {
    setActiveType(dictType);
    setItemPage(1);
    setItemFilters(DEFAULT_ITEM_FILTERS);
    setAppliedItemFilters(DEFAULT_ITEM_FILTERS);
  };

  const closeTypePanel = () => {
    setActiveType(null);
    setDictItems([]);
    setItemTotal(0);
    setItemError("");
    setItemFilters(DEFAULT_ITEM_FILTERS);
    setAppliedItemFilters(DEFAULT_ITEM_FILTERS);
    setItemPage(1);
  };

  const openCreateTypeForm = () => {
    setTypeFormMode("create");
    setEditingType(null);
    typeForm.reset(toTypeFormValues());
    setTypeFormOpen(true);
  };

  const openEditTypeForm = async (dictType: SystemDictTypeRecord) => {
    setTypeFormMode("edit");
    setEditingType(dictType);
    typeForm.reset(toTypeFormValues(dictType));
    setTypeFormOpen(true);

    try {
      const detail = await getDictTypeDetail(dictType.id);
      setEditingType(detail);
      typeForm.reset(toTypeFormValues(detail));
    } catch (detailError) {
      toast.error({
        title: "字典类型详情加载失败",
        description: getErrorMessage(detailError, "无法获取字典类型详情"),
      });
    }
  };

  const submitTypeForm = async (values: DictTypeFormValues) => {
    setTypeSubmitting(true);

    try {
      if (typeFormMode === "edit" && editingType) {
        await updateDictType(editingType.id, buildTypePayload(values));
        toast.success("字典类型已更新");
      } else {
        await createDictType(buildTypePayload(values));
        toast.success("字典类型已创建");
      }

      setTypeFormOpen(false);
      await loadDictTypes();
    } catch (submitError) {
      if (isApiError(submitError) && submitError.fieldErrors) {
        Object.entries(submitError.fieldErrors).forEach(([field, message]) => {
          typeForm.setError(field as keyof DictTypeFormValues, { message });
        });
      }

      toast.error({
        title: typeFormMode === "edit" ? "更新失败" : "创建失败",
        description: getErrorMessage(submitError, "请检查表单后重试"),
      });
    } finally {
      setTypeSubmitting(false);
    }
  };

  const openCreateDataForm = () => {
    if (!selectedType) {
      toast.warning("请先选择字典类型");
      return;
    }

    setDataFormMode("create");
    setEditingData(null);
    dataForm.reset(toDataFormValues());
    setDataFormOpen(true);
  };

  const openEditDataForm = (dictData: SystemDictDataRecord) => {
    setDataFormMode("edit");
    setEditingData(dictData);
    dataForm.reset(toDataFormValues(dictData));
    setDataFormOpen(true);
  };

  const submitDataForm = async (values: DictDataFormValues) => {
    const dictTypeId = editingData?.dictTypeId ?? selectedTypeId;
    if (!dictTypeId) return;

    setDataSubmitting(true);

    try {
      if (dataFormMode === "edit" && editingData) {
        await updateDictData(editingData.id, buildDataPayload(values, dictTypeId));
        toast.success("字典项已更新");
      } else {
        await createDictData(buildDataPayload(values, dictTypeId));
        toast.success("字典项已创建");
      }

      setDataFormOpen(false);
      await loadDictItems();
    } catch (submitError) {
      if (isApiError(submitError) && submitError.fieldErrors) {
        Object.entries(submitError.fieldErrors).forEach(([field, message]) => {
          dataForm.setError(field as keyof DictDataFormValues, { message });
        });
      }

      toast.error({
        title: dataFormMode === "edit" ? "更新失败" : "创建失败",
        description: getErrorMessage(submitError, "请检查表单后重试"),
      });
    } finally {
      setDataSubmitting(false);
    }
  };

  const runConfirmAction = async () => {
    if (!confirmAction) return;

    setConfirmLoading(true);

    try {
      if (confirmAction.type === "deleteType") {
        if (confirmAction.dictType.isBuiltin === 1) {
          toast.warning("内置字典不允许删除");
          return;
        }

        await deleteDictType(confirmAction.dictType.id);
        toast.success("字典类型已删除");
        if (selectedTypeId === confirmAction.dictType.id) {
          closeTypePanel();
        }
        await loadDictTypes();
      }

      if (confirmAction.type === "status") {
        await updateDictTypeStatus(confirmAction.dictType.id, {
          status: confirmAction.status,
        });
        toast.success(
          confirmAction.status === 1 ? "字典类型已启用" : "字典类型已禁用",
        );
        await loadDictTypes();
      }

      if (confirmAction.type === "deleteData") {
        await deleteDictData(confirmAction.dictData.id);
        toast.success("字典项已删除");
        await loadDictItems();
      }

      setConfirmAction(null);
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

    if (confirmAction.type === "deleteType") {
      return {
        title: "删除字典类型",
        description: `确认删除字典类型「${confirmAction.dictType.dictName}」吗？下有字典项时后端会拒绝删除。`,
        confirmText: "删除",
        danger: true,
      };
    }

    if (confirmAction.type === "deleteData") {
      return {
        title: "删除字典项",
        description: `确认删除字典项「${confirmAction.dictData.dictLabel}」吗？此操作不可恢复。`,
        confirmText: "删除",
        danger: true,
      };
    }

    const enabled = confirmAction.status === 1;
    return {
      title: enabled ? "启用字典类型" : "禁用字典类型",
      description: `确认${enabled ? "启用" : "禁用"}字典类型「${confirmAction.dictType.dictName}」吗？`,
      confirmText: enabled ? "启用" : "禁用",
      danger: !enabled,
    };
  }, [confirmAction]);

  const typeColumns: DataTableColumn<SystemDictTypeRecord>[] = [
    {
      title: "字典类型",
      key: "dictType",
      width: 240,
      render: (_, record) => (
        <div>
          <div className="font-medium text-text-primary">{record.dictName}</div>
          <div className="text-xs text-text-tertiary">
            {record.dictCode} · ID {record.id}
          </div>
        </div>
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
      width: 300,
      render: (_, record) => (
        <div className="inline-flex flex-wrap items-center justify-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => selectType(record)}>
            查看项
          </Button>
          <Button size="sm" variant="ghost" onClick={() => void openEditTypeForm(record)}>
            <Pencil className="h-4 w-4" aria-hidden />
            编辑
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              setConfirmAction({
                type: "status",
                dictType: record,
                status: record.status === 1 ? 0 : 1,
              })
            }
          >
            {record.status === 1 ? "禁用" : "启用"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-error hover:text-error"
            disabled={record.isBuiltin === 1}
            title={record.isBuiltin === 1 ? "内置字典不允许删除" : undefined}
            onClick={() => setConfirmAction({ type: "deleteType", dictType: record })}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            删除
          </Button>
        </div>
      ),
    },
  ];

  const itemColumns: DataTableColumn<SystemDictDataRecord>[] = [
    {
      title: "字典项",
      key: "dictData",
      width: 220,
      render: (_, record) => (
        <div>
          <div className="font-medium text-text-primary">{record.dictLabel}</div>
          <div className="text-xs text-text-tertiary">
            {record.dictValue} · ID {record.id}
          </div>
        </div>
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
      width: 180,
      render: (value) => (
        <span className="block max-w-[180px] truncate text-text-secondary">
          {String(value || "-")}
        </span>
      ),
    },
    {
      title: "创建时间",
      dataIndex: "createTime",
      width: 170,
      render: (value) => String(value || "-"),
    },
    {
      title: "操作",
      key: "actions",
      align: "center",
      width: 170,
      render: (_, record) => (
        <div className="inline-flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => openEditDataForm(record)}>
            <Pencil className="h-4 w-4" aria-hidden />
            编辑
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-error hover:text-error"
            onClick={() => setConfirmAction({ type: "deleteData", dictData: record })}
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
        title="字典管理"
        description="维护系统字典类型和字典项，数据来自后端接口。"
        actions={
          <Button variant="primary" onClick={openCreateTypeForm}>
            <Plus className="h-4 w-4" aria-hidden />
            新建字典
          </Button>
        }
      />

      <SearchFilterBar
        actions={
          <>
            <Button variant="secondary" onClick={resetTypeFilters}>
              <RotateCcw className="h-4 w-4" aria-hidden />
              重置
            </Button>
            <Button variant="primary" onClick={() => submitTypeFilters()}>
              <Search className="h-4 w-4" aria-hidden />
              查询
            </Button>
          </>
        }
      >
        <form className="contents" onSubmit={submitTypeFilters}>
          <Input
            value={typeFilters.dictName}
            onChange={(event) =>
              setTypeFilters((current) => ({
                ...current,
                dictName: event.target.value,
              }))
            }
            placeholder="字典名称"
          />
          <Input
            value={typeFilters.dictCode}
            onChange={(event) =>
              setTypeFilters((current) => ({
                ...current,
                dictCode: event.target.value,
              }))
            }
            placeholder="字典编码"
          />
          <Select
            value={String(typeFilters.status)}
            onChange={(event) =>
              setTypeFilters((current) => ({
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

      <div
        className={cn(
          "grid gap-6",
          selectedType
            ? "xl:grid-cols-[minmax(0,0.88fr)_minmax(420px,1.12fr)]"
            : "grid-cols-1",
        )}
      >
        <section className="rounded-admin border border-border bg-surface shadow-admin">
          <TableToolbar
            title="字典类型"
            description={`共 ${typeTotal} 条数据，当前显示 ${dictTypes.length} 条。`}
            actions={
              <>
                <StatusTag tone={typeLoading ? "warning" : typeError ? "error" : "info"}>
                  {typeLoading ? "加载中" : typeError ? "加载失败" : "已同步"}
                </StatusTag>
                <Button size="sm" variant="secondary" onClick={loadDictTypes}>
                  <RefreshCw className="h-4 w-4" aria-hidden />
                  刷新
                </Button>
              </>
            }
          />
          <DataTable<SystemDictTypeRecord>
            columns={typeColumns}
            dataSource={dictTypes}
            rowKey="id"
            loading={typeLoading}
            error={typeError}
            minWidth={1000}
            onRowClick={selectType}
            rowClassName={(record) =>
              selectedType?.id === record.id ? "bg-blue-50/60" : undefined
            }
            empty={
              <EmptyState
                title="暂无字典类型"
                description="调整筛选条件后重新查询。"
                actionText="重置筛选"
                onAction={resetTypeFilters}
              />
            }
          />
          <Pagination
            page={typePage}
            pageSize={typePageSize}
            total={typeTotal}
            disabled={typeLoading}
            onPageChange={setTypePage}
            onPageSizeChange={(nextPageSize) => {
              setTypePageSize(nextPageSize);
              setTypePage(1);
            }}
          />
        </section>

        {selectedType && (
          <section className="rounded-admin border border-border bg-surface shadow-admin">
            <TableToolbar
              title="字典项"
              description={`当前类型：${selectedType.dictName} / ${selectedType.dictCode}`}
              actions={
                <div className="flex items-center gap-2">
                  <StatusTag tone={itemLoading ? "warning" : itemError ? "error" : "info"}>
                    {itemLoading ? "加载中" : itemError ? "加载失败" : "已同步"}
                  </StatusTag>
                  <Button size="sm" variant="secondary" onClick={closeTypePanel}>
                    <X className="h-4 w-4" aria-hidden />
                    收起
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={!selectedType}
                    onClick={openCreateDataForm}
                  >
                    <Plus className="h-4 w-4" aria-hidden />
                    新增项
                  </Button>
                </div>
              }
            />
            <div className="border-b border-border p-4">
              <form className="flex flex-wrap gap-3" onSubmit={submitItemFilters}>
                <div className="relative min-w-[180px] flex-1">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary"
                    aria-hidden
                  />
                  <Input
                    value={itemFilters.dictLabel}
                    onChange={(event) =>
                      setItemFilters((current) => ({
                        ...current,
                        dictLabel: event.target.value,
                      }))
                    }
                    placeholder="字典项名称"
                    className="pl-9"
                    disabled={!selectedType}
                  />
                </div>
                <Input
                  value={itemFilters.dictValue}
                  onChange={(event) =>
                    setItemFilters((current) => ({
                      ...current,
                      dictValue: event.target.value,
                    }))
                  }
                  placeholder="字典项值"
                  className="min-w-[160px] flex-1"
                  disabled={!selectedType}
                />
                <Button variant="secondary" onClick={resetItemFilters}>
                  重置
                </Button>
                <Button variant="primary" type="submit" disabled={!selectedType}>
                  查询
                </Button>
              </form>
            </div>
            <DataTable<SystemDictDataRecord>
              columns={itemColumns}
              dataSource={dictItems}
              rowKey="id"
              loading={itemLoading}
              error={itemError}
              minWidth={830}
              empty={
                <EmptyState
                  title="暂无字典项"
                  description="当前字典类型下没有匹配的字典项。"
                  actionText="重置筛选"
                  onAction={resetItemFilters}
                />
              }
            />
            <Pagination
              page={itemPage}
              pageSize={itemPageSize}
              total={itemTotal}
              disabled={itemLoading || !selectedType}
              onPageChange={setItemPage}
              onPageSizeChange={(nextPageSize) => {
                setItemPageSize(nextPageSize);
                setItemPage(1);
              }}
            />
          </section>
        )}
      </div>

      <DictTypeFormDialog
        open={typeFormOpen}
        mode={typeFormMode}
        form={typeForm}
        loading={typeSubmitting}
        editingType={editingType}
        onCancel={() => setTypeFormOpen(false)}
        onSubmit={submitTypeForm}
      />

      <DictDataFormDialog
        open={dataFormOpen}
        mode={dataFormMode}
        form={dataForm}
        loading={dataSubmitting}
        dictType={selectedType}
        onCancel={() => setDataFormOpen(false)}
        onSubmit={submitDataForm}
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

type DictTypeFormDialogProps = {
  open: boolean;
  mode: FormMode;
  form: UseFormReturn<DictTypeFormValues>;
  loading: boolean;
  editingType: SystemDictTypeRecord | null;
  onCancel: () => void;
  onSubmit: (values: DictTypeFormValues) => void;
};

function DictTypeFormDialog({
  open,
  mode,
  form,
  loading,
  editingType,
  onCancel,
  onSubmit,
}: DictTypeFormDialogProps) {
  if (!open || typeof document === "undefined") return null;

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = form;
  const isBuiltin = mode === "edit" && editingType?.isBuiltin === 1;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 px-4 py-6">
      <section
        className="max-h-[calc(100vh-48px)] w-full max-w-[640px] overflow-hidden rounded-admin border border-border bg-surface shadow-admin"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dict-type-form-title"
      >
        <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <h2
              id="dict-type-form-title"
              className="text-base font-semibold text-text-primary"
            >
              {mode === "edit" ? "编辑字典类型" : "新建字典类型"}
            </h2>
            <p className="mt-1 text-[13px] text-text-tertiary">
              内置字典的字典编码不可修改。
            </p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0"
            disabled={loading}
            onClick={onCancel}
            aria-label="关闭字典类型表单"
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
              label="字典名称"
              htmlFor="dictName"
              required
              error={errors.dictName?.message}
            >
              <Input
                id="dictName"
                disabled={loading}
                placeholder="例如：性别"
                {...register("dictName")}
              />
            </Field>

            <Field
              label="字典编码"
              htmlFor="dictCode"
              required
              error={errors.dictCode?.message}
              help={isBuiltin ? "内置字典编码由系统维护。" : undefined}
            >
              <Input
                id="dictCode"
                disabled={loading}
                readOnly={isBuiltin}
                className={isBuiltin ? "bg-slate-50 text-text-tertiary" : undefined}
                placeholder="例如：gender"
                {...register("dictCode")}
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
                placeholder="补充字典用途或维护说明"
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

type DictDataFormDialogProps = {
  open: boolean;
  mode: FormMode;
  form: UseFormReturn<DictDataFormValues>;
  loading: boolean;
  dictType?: SystemDictTypeRecord | null;
  onCancel: () => void;
  onSubmit: (values: DictDataFormValues) => void;
};

function DictDataFormDialog({
  open,
  mode,
  form,
  loading,
  dictType,
  onCancel,
  onSubmit,
}: DictDataFormDialogProps) {
  if (!open || typeof document === "undefined") return null;

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = form;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 px-4 py-6">
      <section
        className="max-h-[calc(100vh-48px)] w-full max-w-[640px] overflow-hidden rounded-admin border border-border bg-surface shadow-admin"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dict-data-form-title"
      >
        <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <h2
              id="dict-data-form-title"
              className="text-base font-semibold text-text-primary"
            >
              {mode === "edit" ? "编辑字典项" : "新建字典项"}
            </h2>
            <p className="mt-1 text-[13px] text-text-tertiary">
              {dictType
                ? `${dictType.dictName} / ${dictType.dictCode}`
                : "未选择字典类型"}
            </p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0"
            disabled={loading}
            onClick={onCancel}
            aria-label="关闭字典项表单"
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
              label="字典项名称"
              htmlFor="dictLabel"
              required
              error={errors.dictLabel?.message}
            >
              <Input
                id="dictLabel"
                disabled={loading}
                placeholder="例如：男"
                {...register("dictLabel")}
              />
            </Field>

            <Field
              label="字典项值"
              htmlFor="dictValue"
              required
              error={errors.dictValue?.message}
            >
              <Input
                id="dictValue"
                disabled={loading}
                placeholder="例如：MALE"
                {...register("dictValue")}
              />
            </Field>

            <Field
              label="排序"
              htmlFor="dataSortOrder"
              error={errors.sortOrder?.message}
            >
              <Input
                id="dataSortOrder"
                type="number"
                min={0}
                inputMode="numeric"
                disabled={loading}
                {...register("sortOrder")}
              />
            </Field>
          </div>

          <div className="mt-4">
            <Field
              label="备注"
              htmlFor="dataRemark"
              error={errors.remark?.message}
            >
              <Textarea
                id="dataRemark"
                disabled={loading}
                placeholder="补充字典项说明"
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
