import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, RotateCcw, Search } from "lucide-react";
import { getMenuTotal, getMenus } from "@/api/rbac";
import { DataTable } from "@/components/common/data-table";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { SearchFilterBar } from "@/components/common/search-filter-bar";
import { StatusTag } from "@/components/common/status-tag";
import { TableToolbar } from "@/components/common/table-toolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type {
  DataTableColumn,
  MenuRecord,
  MenuStatus,
  MenuType,
} from "@/types";

const statusMeta = {
  enabled: { label: "启用", tone: "success" },
  disabled: { label: "停用", tone: "neutral" },
} as const;

const typeLabelMap: Record<MenuType, string> = {
  directory: "目录",
  menu: "菜单",
  button: "按钮",
};

type MenuRow = MenuRecord & {
  level: number;
  hasChildren: boolean;
};

function flattenMenuTree(items: MenuRecord[], level = 0): MenuRow[] {
  return items.flatMap((item) => {
    const hasChildren = Boolean(item.children?.length);
    const row: MenuRow = {
      ...item,
      level,
      hasChildren,
    };

    const nextRows = hasChildren ? flattenMenuTree(item.children ?? [], level + 1) : [];
    return [row, ...nextRows];
  });
}

export function SystemMenusPage() {
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<MenuStatus | "all">("all");
  const [type, setType] = useState<MenuType | "all">("all");
  const [menus, setMenus] = useState<MenuRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const total = getMenuTotal();

  const loadMenus = useCallback(async () => {
    setLoading(true);
    const data = await getMenus({ keyword, status, type });
    setMenus(data);
    setLoading(false);
  }, [keyword, status, type]);

  useEffect(() => {
    void loadMenus();
  }, [loadMenus]);

  const reset = () => {
    setKeyword("");
    setStatus("all");
    setType("all");
  };

  const rows = useMemo(() => flattenMenuTree(menus), [menus]);

  const columns: DataTableColumn<MenuRow>[] = [
    {
      title: "菜单名称",
      key: "name",
      render: (_, record) => (
        <div
          className="flex items-center gap-2"
          style={{ paddingLeft: record.level * 20 }}
        >
          {record.hasChildren ? (
            <span className="inline-flex h-5 w-5 items-center justify-center rounded border border-border bg-slate-50 text-[10px] text-text-tertiary">
              ▸
            </span>
          ) : (
            <span className="inline-flex h-5 w-5 items-center justify-center text-text-tertiary">
              •
            </span>
          )}
          <div>
            <div className="font-medium text-text-primary">{record.name}</div>
            <div className="text-xs text-text-tertiary">{record.icon}</div>
          </div>
        </div>
      ),
    },
    {
      title: "菜单类型",
      dataIndex: "type",
      width: 100,
      render: (value) => typeLabelMap[value as MenuType],
    },
    {
      title: "路由路径",
      dataIndex: "routePath",
      width: 180,
    },
    {
      title: "组件路径",
      dataIndex: "componentPath",
      width: 200,
      render: (value) => (
        <span className="block max-w-[200px] truncate text-text-secondary">
          {String(value ?? "-")}
        </span>
      ),
    },
    {
      title: "权限标识",
      dataIndex: "permission",
      width: 180,
      render: (value) => (
        <span className="block max-w-[180px] truncate text-text-secondary">
          {String(value ?? "-")}
        </span>
      ),
    },
    {
      title: "图标",
      dataIndex: "icon",
      width: 120,
    },
    {
      title: "排序",
      dataIndex: "sort",
      align: "center",
      width: 90,
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 100,
      render: (value) => {
        const meta = statusMeta[value as MenuStatus];
        return <StatusTag tone={meta.tone}>{meta.label}</StatusTag>;
      },
    },
    {
      title: "更新时间",
      dataIndex: "updatedAt",
      width: 160,
    },
    {
      title: "操作",
      key: "actions",
      align: "center",
      width: 300,
      render: () => (
        <div className="inline-flex flex-wrap items-center gap-2">
          <Button size="sm" variant="ghost">
            编辑
          </Button>
          <Button size="sm" variant="ghost">
            新增子菜单
          </Button>
          <Button size="sm" variant="ghost">
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
        description="维护系统菜单结构，当前使用前端 mock 数据，以树形方式展示。"
        actions={
          <Button variant="primary">
            <Plus className="h-4 w-4" aria-hidden />
            新增菜单
          </Button>
        }
      />

      <SearchFilterBar
        actions={
          <Button variant="secondary" onClick={reset}>
            <RotateCcw className="h-4 w-4" aria-hidden />
            重置
          </Button>
        }
      >
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary"
            aria-hidden
          />
          <Input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="搜索菜单名称、路径或权限标识"
            className="pl-9"
          />
        </div>
        <Select
          value={type}
          onChange={(event) => setType(event.target.value as MenuType | "all")}
          aria-label="筛选菜单类型"
        >
          <option value="all">全部类型</option>
          <option value="directory">目录</option>
          <option value="menu">菜单</option>
          <option value="button">按钮</option>
        </Select>
        <Select
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as MenuStatus | "all")
          }
          aria-label="筛选状态"
        >
          <option value="all">全部状态</option>
          <option value="enabled">启用</option>
          <option value="disabled">停用</option>
        </Select>
      </SearchFilterBar>

      <section className="rounded-admin border border-border bg-surface shadow-admin">
        <TableToolbar
          title="菜单列表"
          description={`共 ${total} 条 mock 数据，当前显示 ${rows.length} 条。`}
          actions={
            <StatusTag tone={loading ? "warning" : "info"}>
              {loading ? "加载中" : "加载完成"}
            </StatusTag>
          }
        />
        <DataTable<MenuRow>
          columns={columns}
          dataSource={rows}
          rowKey="id"
          loading={loading}
          minWidth={1620}
          empty={
            <EmptyState
              title="暂无菜单"
              description="调整筛选条件后重新查询。"
              actionText="重置筛选"
              onAction={reset}
            />
          }
        />
        <div className="flex items-center justify-between border-t border-border px-5 py-3 text-sm text-text-tertiary">
          <span>第 1 页 / 共 1 页</span>
          <div className="flex items-center gap-2">
            <Button size="sm" disabled>
              上一页
            </Button>
            <Button size="sm" disabled>
              下一页
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
