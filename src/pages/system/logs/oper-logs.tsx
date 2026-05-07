import { Eye, RefreshCw, RotateCcw, Search, Trash2 } from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import { clearOperLogs, getOperLogDetail, getOperLogPage } from "@/api/log";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { DataTable } from "@/components/common/data-table";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { Pagination } from "@/components/common/pagination";
import { SearchFilterBar } from "@/components/common/search-filter-bar";
import { StatusTag } from "@/components/common/status-tag";
import { TableToolbar } from "@/components/common/table-toolbar";
import { toast } from "@/components/common/toast-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  DICT_CODES,
  LOG_STATUS_OPTIONS,
  OPERATION_TYPE_OPTIONS,
  type DictSelectOption,
} from "@/constants/dicts";
import { useDictOptions } from "@/hooks/use-dict-options";
import { formatDateTime } from "@/lib/datetime";
import type { DataTableColumn, OperLogDetail, OperLogRecord } from "@/types";
import { OperLogDetailDialog } from "./oper-log-detail-dialog";
import {
  getErrorMessage,
  getOperationTypeLabel,
  getStatusMeta,
  isDev,
} from "./utils";

type FilterState = {
  moduleName: string;
  operationType: "all" | string;
  operatorName: string;
  operationStatus: "all" | string;
};

const DEFAULT_FILTERS: FilterState = {
  moduleName: "",
  operationType: "all",
  operatorName: "",
  operationStatus: "all",
};

function buildQuery(filters: FilterState, page: number, pageSize: number) {
  return {
    page,
    pageSize,
    moduleName: filters.moduleName.trim() || undefined,
    operationType:
      filters.operationType === "all" ? undefined : filters.operationType,
    operatorName: filters.operatorName.trim() || undefined,
    operationStatus:
      filters.operationStatus === "all" ? undefined : filters.operationStatus,
  };
}

function getDictLabel(options: DictSelectOption[], value: string) {
  return options.find((option) => option.value === value)?.label;
}

export function SystemOperLogsPage() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<FilterState>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [logs, setLogs] = useState<OperLogRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState<OperLogDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoadingId, setDetailLoadingId] = useState<number | null>(null);
  const [clearOpen, setClearOpen] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);
  const operationTypeDict = useDictOptions(DICT_CODES.OPERATION_TYPE, {
    fallback: OPERATION_TYPE_OPTIONS,
    showErrorToast: true,
    errorTitle: "操作类型字典加载失败",
  });
  const logStatusDict = useDictOptions(DICT_CODES.LOG_STATUS, {
    fallback: LOG_STATUS_OPTIONS,
    showErrorToast: true,
    errorTitle: "日志状态字典加载失败",
  });

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getOperLogPage(
        buildQuery(appliedFilters, page, pageSize),
      );
      setLogs(data.records);
      setTotal(data.total);
    } catch (loadError) {
      setLogs([]);
      setTotal(0);
      setError(getErrorMessage(loadError, "操作日志加载失败"));
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page, pageSize]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

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

  const openDetail = async (record: OperLogRecord) => {
    setDetail(record);
    setDetailOpen(true);
    setDetailLoadingId(record.id);

    try {
      const data = await getOperLogDetail(record.id);
      setDetail(data);
    } catch (detailError) {
      toast.error({
        title: "操作日志详情加载失败",
        description: getErrorMessage(detailError, "无法获取操作日志详情"),
      });
    } finally {
      setDetailLoadingId(null);
    }
  };

  const runClearLogs = async () => {
    setClearLoading(true);

    try {
      await clearOperLogs();
      toast.success("操作日志已清空");
      setClearOpen(false);
      setPage(1);
      await loadLogs();
    } catch (clearError) {
      toast.error({
        title: "清空失败",
        description: getErrorMessage(clearError, "请稍后重试"),
      });
    } finally {
      setClearLoading(false);
    }
  };

  const columns: DataTableColumn<OperLogRecord>[] = [
    {
      title: "模块",
      key: "module",
      width: 180,
      render: (_, record) => (
        <div>
          <div className="font-medium text-text-primary">
            {record.moduleName || "-"}
          </div>
          <div className="text-xs text-text-tertiary">ID {record.id}</div>
        </div>
      ),
    },
    {
      title: "操作类型",
      dataIndex: "operationType",
      width: 110,
      render: (value) => {
        const type = String(value || "");
        return (
          <StatusTag tone="info">
            {getDictLabel(operationTypeDict.options, type) ||
              getOperationTypeLabel(type)}
          </StatusTag>
        );
      },
    },
    {
      title: "请求",
      key: "request",
      width: 260,
      render: (_, record) => (
        <div>
          <div className="font-medium text-text-primary">
            {record.requestMethod || "-"}
          </div>
          <div className="max-w-[240px] truncate text-xs text-text-tertiary">
            {record.requestUrl || "-"}
          </div>
        </div>
      ),
    },
    {
      title: "操作人",
      key: "operator",
      width: 180,
      render: (_, record) => (
        <div>
          <div className="text-text-primary">{record.operatorName || "-"}</div>
          <div className="text-xs text-text-tertiary tabular-nums">
            {record.operatorIp || "-"}
          </div>
        </div>
      ),
    },
    {
      title: "状态",
      dataIndex: "operationStatus",
      width: 100,
      render: (value) => {
        const status = String(value ?? "");
        const meta = getStatusMeta(status);
        return (
          <StatusTag tone={meta.tone}>
            {getDictLabel(logStatusDict.options, status) || meta.label}
          </StatusTag>
        );
      },
    },
    {
      title: "耗时",
      dataIndex: "costTime",
      align: "right",
      width: 100,
      render: (value) => (
        <span className="tabular-nums">{String(value ?? 0)} ms</span>
      ),
    },
    {
      title: "操作时间",
      dataIndex: "operationTime",
      width: 180,
      render: (value) => (
        <span className="whitespace-nowrap tabular-nums">
          {formatDateTime(
            typeof value === "string" ? value : value ? String(value) : "",
          )}
        </span>
      ),
    },
    {
      title: "操作",
      key: "actions",
      align: "center",
      width: 120,
      render: (_, record) => (
        <Button
          size="sm"
          variant="ghost"
          disabled={detailLoadingId === record.id}
          onClick={() => void openDetail(record)}
        >
          <Eye className="h-4 w-4" aria-hidden />
          详情
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="操作日志"
        description="查看系统操作记录，支持按模块、类型、操作人和状态筛选。"
      />

      <form onSubmit={submitFilters}>
        <SearchFilterBar
          actions={
            <>
              <Button type="submit" variant="primary">
                <Search className="h-4 w-4" aria-hidden />
                查询
              </Button>
              <Button variant="secondary" onClick={resetFilters}>
                <RotateCcw className="h-4 w-4" aria-hidden />
                重置
              </Button>
            </>
          }
        >
          <Input
            value={filters.moduleName}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                moduleName: event.target.value,
              }))
            }
            placeholder="搜索模块名称"
            aria-label="搜索模块名称"
          />
          <Select
            value={filters.operationType}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                operationType: event.target.value,
              }))
            }
            aria-label="筛选操作类型"
          >
            <option value="all">全部类型</option>
            {operationTypeDict.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Input
            value={filters.operatorName}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                operatorName: event.target.value,
              }))
            }
            placeholder="搜索操作人"
            aria-label="搜索操作人"
          />
          <Select
            value={filters.operationStatus}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                operationStatus: event.target.value,
              }))
            }
            aria-label="筛选操作状态"
          >
            <option value="all">全部状态</option>
            {logStatusDict.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </SearchFilterBar>
      </form>

      <section className="rounded-admin border border-border bg-surface shadow-admin">
        <TableToolbar
          title="操作日志列表"
          description={`共 ${total} 条记录。`}
          actions={
            <>
              <Button
                variant="secondary"
                size="sm"
                disabled={loading}
                onClick={() => void loadLogs()}
              >
                <RefreshCw className="h-4 w-4" aria-hidden />
                刷新
              </Button>
              {isDev && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="text-error hover:text-error"
                  onClick={() => setClearOpen(true)}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                  清空日志
                </Button>
              )}
            </>
          }
        />
        <DataTable<OperLogRecord>
          columns={columns}
          dataSource={logs}
          rowKey="id"
          loading={loading}
          error={error}
          minWidth={1220}
          empty={
            <EmptyState
              title="暂无操作日志"
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

      <OperLogDetailDialog
        open={detailOpen}
        detail={detail}
        loading={detailLoadingId !== null}
        onCancel={() => setDetailOpen(false)}
      />

      <ConfirmDialog
        open={clearOpen}
        title="清空操作日志"
        description="确认清空所有操作日志吗？此操作不可恢复。"
        confirmText="清空"
        danger
        loading={clearLoading}
        onConfirm={() => void runClearLogs()}
        onCancel={() => setClearOpen(false)}
      />
    </>
  );
}
