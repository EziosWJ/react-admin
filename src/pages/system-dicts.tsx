import { useCallback, useEffect, useState } from "react";
import { Plus, RotateCcw, Search } from "lucide-react";
import {
  getDictItems,
  getDictTypeTotal,
  getDictTypes,
} from "@/api/system";
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
  DictItemRecord,
  DictTypeRecord,
  SystemStatus,
} from "@/types";

const statusMeta = {
  enabled: { label: "启用", tone: "success" },
  disabled: { label: "停用", tone: "neutral" },
} as const;

export function SystemDictsPage() {
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<SystemStatus | "all">("all");
  const [itemKeyword, setItemKeyword] = useState("");
  const [dictTypes, setDictTypes] = useState<DictTypeRecord[]>([]);
  const [dictItems, setDictItems] = useState<DictItemRecord[]>([]);
  const [selectedTypeCode, setSelectedTypeCode] = useState("user_status");
  const [typeLoading, setTypeLoading] = useState(false);
  const [itemLoading, setItemLoading] = useState(false);
  const total = getDictTypeTotal();

  const loadDictTypes = useCallback(async () => {
    setTypeLoading(true);
    const data = await getDictTypes({ keyword, status });
    setDictTypes(data);
    if (data.length > 0 && !data.some((item) => item.code === selectedTypeCode)) {
      setSelectedTypeCode(data[0].code);
    }
    setTypeLoading(false);
  }, [keyword, selectedTypeCode, status]);

  const loadDictItems = useCallback(async () => {
    setItemLoading(true);
    const data = await getDictItems(selectedTypeCode, {
      keyword: itemKeyword,
      status: "all",
    });
    setDictItems(data);
    setItemLoading(false);
  }, [itemKeyword, selectedTypeCode]);

  useEffect(() => {
    void loadDictTypes();
  }, [loadDictTypes]);

  useEffect(() => {
    void loadDictItems();
  }, [loadDictItems]);

  const resetTypes = () => {
    setKeyword("");
    setStatus("all");
  };

  const resetItems = () => {
    setItemKeyword("");
  };

  const typeColumns: DataTableColumn<DictTypeRecord>[] = [
    {
      title: "字典类型",
      key: "name",
      render: (_, record) => (
        <div>
          <div className="font-medium text-text-primary">{record.name}</div>
          <div className="text-xs text-text-tertiary">{record.code}</div>
        </div>
      ),
    },
    {
      title: "字典项数",
      dataIndex: "itemCount",
      align: "center",
      width: 100,
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
      width: 220,
      render: (_, record) => (
        <div className="inline-flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelectedTypeCode(record.code)}
          >
            查看项
          </Button>
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

  const itemColumns: DataTableColumn<DictItemRecord>[] = [
    {
      title: "字典项",
      key: "label",
      render: (_, record) => (
        <div>
          <div className="font-medium text-text-primary">{record.label}</div>
          <div className="text-xs text-text-tertiary">{record.value}</div>
        </div>
      ),
    },
    {
      title: "排序",
      dataIndex: "sort",
      align: "center",
      width: 100,
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
      width: 160,
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

  const selectedType = dictTypes.find((item) => item.code === selectedTypeCode);

  return (
    <>
      <PageHeader
        title="字典管理"
        description="维护系统字典类型和字典项，当前使用前端 mock 数据。"
        actions={
          <Button variant="primary">
            <Plus className="h-4 w-4" aria-hidden />
            新增字典
          </Button>
        }
      />

      <SearchFilterBar
        actions={
          <Button variant="secondary" onClick={resetTypes}>
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
            placeholder="搜索字典名称或编码"
            className="pl-9"
          />
        </div>
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(420px,0.85fr)]">
        <section className="rounded-admin border border-border bg-surface shadow-admin">
          <TableToolbar
            title="字典类型"
            description={`共 ${total} 条 mock 数据，当前显示 ${dictTypes.length} 条。`}
            actions={
              <StatusTag tone={typeLoading ? "warning" : "info"}>
                {typeLoading ? "加载中" : "加载完成"}
              </StatusTag>
            }
          />
          <DataTable<DictTypeRecord>
            columns={typeColumns}
            dataSource={dictTypes}
            rowKey="id"
            loading={typeLoading}
            minWidth={760}
            empty={
              <EmptyState
                title="暂无字典类型"
                description="调整筛选条件后重新查询。"
                actionText="重置筛选"
                onAction={resetTypes}
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

        <section className="rounded-admin border border-border bg-surface shadow-admin">
          <TableToolbar
            title="字典项"
            description={selectedType ? `当前类型：${selectedType.name}` : "请选择字典类型"}
            actions={
              <div className="flex items-center gap-2">
                <StatusTag tone={itemLoading ? "warning" : "info"}>
                  {itemLoading ? "加载中" : "加载完成"}
                </StatusTag>
                <Button size="sm" variant="secondary">
                  新增项
                </Button>
              </div>
            }
          />
          <div className="border-b border-border p-4">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary"
                  aria-hidden
                />
                <Input
                  value={itemKeyword}
                  onChange={(event) => setItemKeyword(event.target.value)}
                  placeholder="搜索字典项名称或值"
                  className="pl-9"
                />
              </div>
              <Button variant="secondary" onClick={resetItems}>
                重置
              </Button>
            </div>
          </div>
          <DataTable<DictItemRecord>
            columns={itemColumns}
            dataSource={dictItems}
            rowKey="id"
            loading={itemLoading}
            minWidth={680}
            empty={
              <EmptyState
                title="暂无字典项"
                description="当前字典类型下没有匹配的字典项。"
                actionText="重置筛选"
                onAction={resetItems}
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
      </div>
    </>
  );
}

