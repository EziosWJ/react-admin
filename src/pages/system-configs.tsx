import { useCallback, useEffect, useState } from "react";
import { Plus, RotateCcw, Search } from "lucide-react";
import { getSystemConfigTotal, getSystemConfigs } from "@/api/system";
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
  ConfigType,
  DataTableColumn,
  SystemConfigRecord,
  SystemStatus,
} from "@/types";

const statusMeta = {
  enabled: { label: "启用", tone: "success" },
  disabled: { label: "停用", tone: "neutral" },
} as const;

const typeLabelMap: Record<ConfigType, string> = {
  string: "字符串",
  number: "数字",
  boolean: "布尔值",
  json: "JSON",
};

export function SystemConfigsPage() {
  const [keyword, setKeyword] = useState("");
  const [type, setType] = useState<ConfigType | "all">("all");
  const [status, setStatus] = useState<SystemStatus | "all">("all");
  const [configs, setConfigs] = useState<SystemConfigRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const total = getSystemConfigTotal();

  const loadConfigs = useCallback(async () => {
    setLoading(true);
    const data = await getSystemConfigs({ keyword, type, status });
    setConfigs(data);
    setLoading(false);
  }, [keyword, status, type]);

  useEffect(() => {
    void loadConfigs();
  }, [loadConfigs]);

  const reset = () => {
    setKeyword("");
    setType("all");
    setStatus("all");
  };

  const columns: DataTableColumn<SystemConfigRecord>[] = [
    {
      title: "配置名称",
      key: "name",
      render: (_, record) => (
        <div>
          <div className="font-medium text-text-primary">{record.name}</div>
          <div className="text-xs text-text-tertiary">{record.key}</div>
        </div>
      ),
    },
    {
      title: "配置键",
      dataIndex: "key",
      width: 220,
    },
    {
      title: "配置值",
      dataIndex: "value",
      width: 220,
      render: (value) => (
        <span className="block max-w-[220px] truncate text-text-secondary">
          {String(value ?? "")}
        </span>
      ),
    },
    {
      title: "配置类型",
      dataIndex: "type",
      width: 120,
      render: (value) => typeLabelMap[value as ConfigType],
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 100,
      render: (value) => {
        const meta = statusMeta[value as SystemStatus];
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
      width: 180,
      render: () => (
        <div className="inline-flex items-center gap-2">
          <Button size="sm" variant="ghost">
            编辑
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
        title="配置管理"
        description="维护系统配置项，当前使用前端 mock 数据。"
        actions={
          <Button variant="primary">
            <Plus className="h-4 w-4" aria-hidden />
            新增配置
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
            placeholder="搜索配置名称或配置键"
            className="pl-9"
          />
        </div>
        <Select
          value={type}
          onChange={(event) => setType(event.target.value as ConfigType | "all")}
          aria-label="筛选配置类型"
        >
          <option value="all">全部类型</option>
          <option value="string">字符串</option>
          <option value="number">数字</option>
          <option value="boolean">布尔值</option>
          <option value="json">JSON</option>
        </Select>
        <Select
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as SystemStatus | "all")
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
          title="配置项列表"
          description={`共 ${total} 条 mock 数据，当前显示 ${configs.length} 条。`}
          actions={
            <StatusTag tone={loading ? "warning" : "info"}>
              {loading ? "加载中" : "加载完成"}
            </StatusTag>
          }
        />
        <DataTable<SystemConfigRecord>
          columns={columns}
          dataSource={configs}
          rowKey="id"
          loading={loading}
          minWidth={1080}
          empty={
            <EmptyState
              title="暂无配置项"
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
