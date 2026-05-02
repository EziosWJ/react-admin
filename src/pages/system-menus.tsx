import { zodResolver } from "@hookform/resolvers/zod";
import {
  ExternalLink,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { createPortal } from "react-dom";
import { useForm, type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import {
  createMenu,
  deleteMenu,
  getMenuDetail,
  getMenuPage,
  getSystemMenuTree,
  updateMenu,
  updateMenuStatus,
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
import { TreeSelect, type TreeSelectNode } from "@/components/common/tree-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { isApiError } from "@/lib/api-error";
import { getMenuIcon } from "@/lib/menu-icons";
import type {
  ApiStatus,
  DataTableColumn,
  SystemMenuRecord,
  SystemMenuTreeRecord,
  SystemMenuType,
} from "@/types";

type FilterState = {
  menuName: string;
  menuType: "all" | SystemMenuType;
  status: "all" | ApiStatus;
  visible: "all" | ApiStatus;
};

type MenuRow = SystemMenuRecord & {
  level: number;
  hasChildren: boolean;
};

type MenuFormMode = "create" | "edit";

type ConfirmAction =
  | { type: "delete"; menu: SystemMenuRecord }
  | { type: "status"; menu: SystemMenuRecord; status: ApiStatus };

const DEFAULT_FILTERS: FilterState = {
  menuName: "",
  menuType: "all",
  status: "all",
  visible: "all",
};

const statusMeta: Record<ApiStatus, { label: string; tone: "success" | "neutral" }> = {
  1: { label: "启用", tone: "success" },
  0: { label: "禁用", tone: "neutral" },
};

const visibleMeta: Record<ApiStatus, { label: string; tone: "info" | "neutral" }> = {
  1: { label: "显示", tone: "info" },
  0: { label: "隐藏", tone: "neutral" },
};

const typeLabelMap: Record<SystemMenuType, string> = {
  DIR: "目录",
  MENU: "菜单",
  LINK: "外链",
};

const emptyToUndefined = (value: unknown) =>
  value === "" || value === null ? undefined : value;

const menuFormSchema = z
  .object({
    parentId: z.coerce.number().int().min(0),
    menuName: z
      .string()
      .trim()
      .min(1, "菜单名称不能为空")
      .max(64, "菜单名称不能超过 64 个字符"),
    menuType: z.union([z.literal("DIR"), z.literal("MENU"), z.literal("LINK")]),
    path: z.preprocess(
      emptyToUndefined,
      z.string().trim().max(128, "路由路径不能超过 128 个字符").optional(),
    ),
    component: z.preprocess(
      emptyToUndefined,
      z.string().trim().max(128, "组件路径不能超过 128 个字符").optional(),
    ),
    icon: z.preprocess(
      emptyToUndefined,
      z.string().trim().max(64, "图标标识不能超过 64 个字符").optional(),
    ),
    permissionCode: z.preprocess(
      emptyToUndefined,
      z.string().trim().max(128, "权限标识不能超过 128 个字符").optional(),
    ),
    externalUrl: z.preprocess(
      emptyToUndefined,
      z.string().trim().max(255, "外链地址不能超过 255 个字符").optional(),
    ),
    sortOrder: z.coerce.number().int("排序必须是整数").min(0, "排序不能小于 0"),
    visible: z.coerce.number().pipe(z.union([z.literal(0), z.literal(1)])),
    status: z.coerce.number().pipe(z.union([z.literal(0), z.literal(1)])),
    remark: z.preprocess(
      emptyToUndefined,
      z.string().trim().max(200, "备注不能超过 200 个字符").optional(),
    ),
  })
  .superRefine((values, ctx) => {
    if (values.menuType !== "LINK" && !values.path) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["path"],
        message: "目录和菜单需要填写路由路径",
      });
    }

    if (values.menuType === "LINK" && !values.externalUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["externalUrl"],
        message: "外链菜单需要填写外链地址",
      });
    }
  });

type MenuFormValues = z.infer<typeof menuFormSchema>;

function getErrorMessage(error: unknown, fallback: string) {
  if (isApiError(error)) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

function buildQuery(filters: FilterState, page: number, pageSize: number) {
  return {
    page,
    pageSize,
    menuName: filters.menuName.trim() || undefined,
    menuType: filters.menuType === "all" ? undefined : filters.menuType,
    status: filters.status === "all" ? undefined : filters.status,
    visible: filters.visible === "all" ? undefined : filters.visible,
  };
}

function compactText(value?: string | null) {
  const text = value?.trim();
  return text || undefined;
}

function buildMenuPayload(values: MenuFormValues) {
  return {
    parentId: values.parentId,
    menuName: values.menuName.trim(),
    menuType: values.menuType,
    path: compactText(values.path),
    component: values.menuType === "LINK" ? undefined : compactText(values.component),
    icon: compactText(values.icon),
    permissionCode: compactText(values.permissionCode),
    sortOrder: values.sortOrder,
    visible: values.visible,
    status: values.status,
    externalUrl:
      values.menuType === "LINK" ? compactText(values.externalUrl) : undefined,
    remark: compactText(values.remark),
  };
}

function toFormValues(menu?: SystemMenuRecord, parentId = 0): MenuFormValues {
  return {
    parentId: menu?.parentId ?? parentId,
    menuName: menu?.menuName ?? "",
    menuType: menu?.menuType ?? "MENU",
    path: menu?.path ?? "",
    component: menu?.component ?? "",
    icon: menu?.icon ?? "",
    permissionCode: menu?.permissionCode ?? "",
    externalUrl: menu?.externalUrl ?? "",
    sortOrder: menu?.sortOrder ?? 0,
    visible: menu?.visible === 0 ? 0 : 1,
    status: menu?.status === 0 ? 0 : 1,
    remark: menu?.remark ?? "",
  };
}

function flattenMenuTree(items: SystemMenuRecord[], level = 0): MenuRow[] {
  return items.flatMap((item) => {
    const hasChildren = Boolean(item.children?.length);
    const row: MenuRow = {
      ...item,
      level,
      hasChildren,
    };

    const nextRows = hasChildren
      ? flattenMenuTree(item.children ?? [], level + 1)
      : [];
    return [row, ...nextRows];
  });
}

function collectDescendantIds(menu?: SystemMenuRecord | null) {
  const ids = new Set<number>();

  const walk = (items?: SystemMenuRecord[]) => {
    items?.forEach((item) => {
      ids.add(item.id);
      walk(item.children);
    });
  };

  walk(menu?.children);
  return ids;
}

function menuTreeToSelectNodes(
  items: SystemMenuTreeRecord[],
  disabledIds = new Set<number>(),
): TreeSelectNode[] {
  return items.map((item) => ({
    id: item.id,
    label: `${item.menuName} / ${typeLabelMap[item.menuType]}`,
    disabled: disabledIds.has(item.id) || item.status === 0,
    children: item.children?.length
      ? menuTreeToSelectNodes(item.children, disabledIds)
      : undefined,
  }));
}

export function SystemMenusPage() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<FilterState>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [menus, setMenus] = useState<SystemMenuRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<MenuFormMode>("create");
  const [editingMenu, setEditingMenu] = useState<SystemMenuRecord | null>(null);
  const [parentTree, setParentTree] = useState<SystemMenuTreeRecord[]>([]);
  const [treeLoading, setTreeLoading] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const form = useForm<MenuFormValues>({
    resolver: zodResolver(menuFormSchema),
    defaultValues: toFormValues(),
  });

  const loadMenus = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getMenuPage(buildQuery(appliedFilters, page, pageSize));
      setMenus(data.records);
      setTotal(data.total);
    } catch (loadError) {
      setMenus([]);
      setTotal(0);
      setError(getErrorMessage(loadError, "菜单列表加载失败"));
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page, pageSize]);

  const loadParentTree = useCallback(async () => {
    setTreeLoading(true);
    try {
      const data = await getSystemMenuTree();
      setParentTree(data);
    } catch (loadError) {
      setParentTree([]);
      toast.error({
        title: "菜单树加载失败",
        description: getErrorMessage(loadError, "无法获取父级菜单"),
      });
    } finally {
      setTreeLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMenus();
  }, [loadMenus]);

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

  const openCreateForm = async (parentId = 0) => {
    setFormMode("create");
    setEditingMenu(null);
    form.reset(toFormValues(undefined, parentId));
    setFormOpen(true);
    await loadParentTree();
  };

  const openEditForm = async (menu: SystemMenuRecord) => {
    setFormMode("edit");
    setEditingMenu(menu);
    form.reset(toFormValues(menu));
    setFormOpen(true);
    await loadParentTree();

    try {
      const detail = await getMenuDetail(menu.id);
      const nextMenu = { ...menu, ...detail };
      setEditingMenu(nextMenu);
      form.reset(toFormValues(nextMenu));
    } catch (detailError) {
      toast.error({
        title: "菜单详情加载失败",
        description: getErrorMessage(detailError, "无法获取菜单详情"),
      });
    }
  };

  const submitMenuForm = async (values: MenuFormValues) => {
    setFormSubmitting(true);

    try {
      if (formMode === "edit" && editingMenu) {
        await updateMenu(editingMenu.id, buildMenuPayload(values));
        toast.success("菜单已更新");
      } else {
        await createMenu(buildMenuPayload(values));
        toast.success("菜单已创建");
      }

      setFormOpen(false);
      await loadMenus();
    } catch (submitError) {
      if (isApiError(submitError) && submitError.fieldErrors) {
        Object.entries(submitError.fieldErrors).forEach(([field, message]) => {
          form.setError(field as keyof MenuFormValues, { message });
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
        if (confirmAction.menu.isBuiltin === 1) {
          toast.warning("内置菜单不允许删除");
          return;
        }

        await deleteMenu(confirmAction.menu.id);
        toast.success("菜单已删除");
      }

      if (confirmAction.type === "status") {
        await updateMenuStatus(confirmAction.menu.id, {
          status: confirmAction.status,
        });
        toast.success(
          confirmAction.status === 1 ? "菜单已启用" : "菜单已禁用",
        );
      }

      setConfirmAction(null);
      await loadMenus();
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
        title: "删除菜单",
        description: `确认删除菜单「${confirmAction.menu.menuName}」吗？此操作不可恢复。`,
        confirmText: "删除",
        danger: true,
      };
    }

    const enabled = confirmAction.status === 1;
    return {
      title: enabled ? "启用菜单" : "禁用菜单",
      description: `确认${enabled ? "启用" : "禁用"}菜单「${confirmAction.menu.menuName}」吗？`,
      confirmText: enabled ? "启用" : "禁用",
      danger: !enabled,
    };
  }, [confirmAction]);

  const rows = useMemo(() => flattenMenuTree(menus), [menus]);

  const parentNodes = useMemo<TreeSelectNode[]>(() => {
    const disabledIds = collectDescendantIds(editingMenu);
    if (editingMenu) disabledIds.add(editingMenu.id);

    return [
      {
        id: 0,
        label: "根目录",
        children: menuTreeToSelectNodes(parentTree, disabledIds),
      },
    ];
  }, [editingMenu, parentTree]);

  const columns: DataTableColumn<MenuRow>[] = [
    {
      title: "菜单名称",
      key: "menu",
      width: 260,
      render: (_, menu) => {
        const Icon = getMenuIcon(menu.icon);

        return (
          <div
            className="flex items-center gap-2"
            style={{ paddingLeft: menu.level * 20 }}
          >
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-slate-50 text-text-secondary">
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <div className="truncate font-medium text-text-primary">
                {menu.menuName}
              </div>
              <div className="text-xs text-text-tertiary">
                ID {menu.id} · 父级 {menu.parentId}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: "类型",
      dataIndex: "menuType",
      width: 96,
      render: (value) => typeLabelMap[value as SystemMenuType],
    },
    {
      title: "路由 / 外链",
      key: "path",
      width: 220,
      render: (_, menu) => (
        <span className="block max-w-[220px] truncate text-text-secondary">
          {menu.menuType === "LINK" ? menu.externalUrl || "-" : menu.path || "-"}
        </span>
      ),
    },
    {
      title: "组件路径",
      dataIndex: "component",
      width: 200,
      render: (value) => (
        <span className="block max-w-[200px] truncate text-text-secondary">
          {String(value || "-")}
        </span>
      ),
    },
    {
      title: "权限标识",
      dataIndex: "permissionCode",
      width: 190,
      render: (value) => (
        <span className="block max-w-[190px] truncate text-text-secondary">
          {String(value || "-")}
        </span>
      ),
    },
    {
      title: "可见性",
      dataIndex: "visible",
      width: 96,
      render: (value) => {
        const meta = visibleMeta[(value === 0 ? 0 : 1) as ApiStatus];
        return <StatusTag tone={meta.tone}>{meta.label}</StatusTag>;
      },
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 96,
      render: (value) => {
        const meta = statusMeta[(value === 0 ? 0 : 1) as ApiStatus];
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
      width: 80,
      render: (value) => <span className="tabular-nums">{String(value ?? 0)}</span>,
    },
    {
      title: "操作",
      key: "actions",
      align: "center",
      width: 330,
      render: (_, menu) => (
        <div className="inline-flex flex-wrap items-center justify-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => void openEditForm(menu)}>
            <Pencil className="h-4 w-4" aria-hidden />
            编辑
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => void openCreateForm(menu.id)}
          >
            <Plus className="h-4 w-4" aria-hidden />
            子菜单
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              setConfirmAction({
                type: "status",
                menu,
                status: menu.status === 1 ? 0 : 1,
              })
            }
          >
            {menu.status === 1 ? "禁用" : "启用"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-error hover:text-error"
            disabled={menu.isBuiltin === 1}
            title={menu.isBuiltin === 1 ? "内置菜单不允许删除" : undefined}
            onClick={() => setConfirmAction({ type: "delete", menu })}
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
        title="菜单管理"
        description="维护系统菜单结构、路由、外链、权限标识和展示状态。"
        actions={
          <Button variant="primary" onClick={() => void openCreateForm()}>
            <Plus className="h-4 w-4" aria-hidden />
            新建菜单
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
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary"
              aria-hidden
            />
            <Input
              value={filters.menuName}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  menuName: event.target.value,
                }))
              }
              placeholder="菜单名称"
              className="pl-9"
            />
          </div>
          <Select
            value={filters.menuType}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                menuType: event.target.value as FilterState["menuType"],
              }))
            }
            aria-label="筛选菜单类型"
          >
            <option value="all">全部类型</option>
            <option value="DIR">目录</option>
            <option value="MENU">菜单</option>
            <option value="LINK">外链</option>
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
          <Select
            value={String(filters.visible)}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                visible:
                  event.target.value === "all"
                    ? "all"
                    : (Number(event.target.value) as ApiStatus),
              }))
            }
            aria-label="筛选可见性"
          >
            <option value="all">全部可见性</option>
            <option value="1">显示</option>
            <option value="0">隐藏</option>
          </Select>
        </form>
      </SearchFilterBar>

      <section className="rounded-admin border border-border bg-surface shadow-admin">
        <TableToolbar
          title="菜单列表"
          description={`共 ${total} 条数据，当前显示 ${rows.length} 条。`}
          actions={
            <>
              <StatusTag tone={loading ? "warning" : error ? "error" : "info"}>
                {loading ? "加载中" : error ? "加载失败" : "已同步"}
              </StatusTag>
              <Button size="sm" variant="secondary" onClick={loadMenus}>
                <RefreshCw className="h-4 w-4" aria-hidden />
                刷新
              </Button>
            </>
          }
        />
        <DataTable<MenuRow>
          columns={columns}
          dataSource={rows}
          rowKey="id"
          loading={loading}
          error={error}
          minWidth={1660}
          empty={
            <EmptyState
              title="暂无菜单数据"
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

      <MenuFormDialog
        open={formOpen}
        mode={formMode}
        form={form}
        loading={formSubmitting}
        treeLoading={treeLoading}
        editingMenu={editingMenu}
        parentNodes={parentNodes}
        onCancel={() => setFormOpen(false)}
        onSubmit={submitMenuForm}
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

type MenuFormDialogProps = {
  open: boolean;
  mode: MenuFormMode;
  form: UseFormReturn<MenuFormValues>;
  loading: boolean;
  treeLoading: boolean;
  editingMenu: SystemMenuRecord | null;
  parentNodes: TreeSelectNode[];
  onCancel: () => void;
  onSubmit: (values: MenuFormValues) => void;
};

function MenuFormDialog({
  open,
  mode,
  form,
  loading,
  treeLoading,
  editingMenu,
  parentNodes,
  onCancel,
  onSubmit,
}: MenuFormDialogProps) {
  const menuType = form.watch("menuType");

  if (!open || typeof document === "undefined") return null;

  const {
    formState: { errors },
    handleSubmit,
    register,
    setValue,
    watch,
  } = form;
  const isBuiltin = mode === "edit" && editingMenu?.isBuiltin === 1;
  const parentId = watch("parentId");

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 px-4 py-6">
      <section
        className="max-h-[calc(100vh-48px)] w-full max-w-[800px] overflow-hidden rounded-admin border border-border bg-surface shadow-admin"
        role="dialog"
        aria-modal="true"
        aria-labelledby="menu-form-title"
      >
        <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <h2
              id="menu-form-title"
              className="text-base font-semibold text-text-primary"
            >
              {mode === "edit" ? "编辑菜单" : "新建菜单"}
            </h2>
            <p className="mt-1 text-[13px] text-text-tertiary">
              菜单类型使用 DIR / MENU / LINK，与后端协议保持一致。
            </p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0"
            disabled={loading}
            onClick={onCancel}
            aria-label="关闭菜单表单"
          >
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </header>

        <form
          className="max-h-[calc(100vh-150px)] overflow-y-auto px-5 py-5"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="父级菜单" error={errors.parentId?.message}>
              <TreeSelect
                value={parentId}
                nodes={parentNodes}
                disabled={loading || treeLoading}
                clearable={false}
                placeholder={treeLoading ? "菜单树加载中" : "请选择父级菜单"}
                onChange={(value) => {
                  setValue("parentId", Number(value ?? 0), {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }}
              />
            </Field>

            <Field
              label="菜单名称"
              htmlFor="menuName"
              required
              error={errors.menuName?.message}
            >
              <Input
                id="menuName"
                disabled={loading}
                placeholder="例如：用户管理"
                {...register("menuName")}
              />
            </Field>

            <Field
              label="菜单类型"
              htmlFor="menuType"
              required
              error={errors.menuType?.message}
              help={isBuiltin ? "内置菜单类型不建议修改。" : undefined}
            >
              <Select
                id="menuType"
                disabled={loading || isBuiltin}
                {...register("menuType")}
              >
                <option value="DIR">目录</option>
                <option value="MENU">菜单</option>
                <option value="LINK">外链</option>
              </Select>
            </Field>

            <Field
              label="路由路径"
              htmlFor="path"
              required={menuType !== "LINK"}
              error={errors.path?.message}
            >
              <Input
                id="path"
                disabled={loading}
                readOnly={isBuiltin}
                className={isBuiltin ? "bg-slate-50 text-text-tertiary" : undefined}
                placeholder="/system/user"
                {...register("path")}
              />
            </Field>

            <Field
              label="组件路径"
              htmlFor="component"
              error={errors.component?.message}
              help={menuType === "LINK" ? "外链菜单可不填写组件路径。" : undefined}
            >
              <Input
                id="component"
                disabled={loading || menuType === "LINK"}
                readOnly={isBuiltin}
                className={isBuiltin ? "bg-slate-50 text-text-tertiary" : undefined}
                placeholder="system/user/index"
                {...register("component")}
              />
            </Field>

            <Field
              label="外链地址"
              htmlFor="externalUrl"
              required={menuType === "LINK"}
              error={errors.externalUrl?.message}
            >
              <div className="relative">
                <ExternalLink
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary"
                  aria-hidden
                />
                <Input
                  id="externalUrl"
                  disabled={loading || menuType !== "LINK"}
                  placeholder="https://example.com"
                  className="pl-9"
                  {...register("externalUrl")}
                />
              </div>
            </Field>

            <Field
              label="权限标识"
              htmlFor="permissionCode"
              error={errors.permissionCode?.message}
              help="非空时由后端校验唯一性。"
            >
              <Input
                id="permissionCode"
                disabled={loading}
                readOnly={isBuiltin}
                className={isBuiltin ? "bg-slate-50 text-text-tertiary" : undefined}
                placeholder="system:user:list"
                {...register("permissionCode")}
              />
            </Field>

            <Field
              label="图标标识"
              htmlFor="icon"
              error={errors.icon?.message}
              help="例如 setting、user、menu，未匹配时使用默认图标。"
            >
              <Input
                id="icon"
                disabled={loading}
                readOnly={isBuiltin}
                className={isBuiltin ? "bg-slate-50 text-text-tertiary" : undefined}
                placeholder="setting"
                {...register("icon")}
              />
            </Field>

            <Field label="可见性" htmlFor="visible" error={errors.visible?.message}>
              <Select id="visible" disabled={loading} {...register("visible")}>
                <option value="1">显示</option>
                <option value="0">隐藏</option>
              </Select>
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
                placeholder="补充菜单用途或维护说明"
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
