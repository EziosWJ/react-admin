import {
  Eye,
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
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { clearOperLogs, getOperLogDetail, getOperLogPage } from "@/api/log";
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
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { isApiError } from "@/lib/api-error";
import type { DataTableColumn, OperLogDetail, OperLogRecord } from "@/types";

type FilterState = {
  moduleName: string;
  operationType: "all" | string;
  operatorName: string;
  operationStatus: "all" | string;
};

type ViteImportMeta = ImportMeta & {
  env?: {
    DEV?: boolean;
  };
};

const DEFAULT_FILTERS: FilterState = {
  moduleName: "",
  operationType: "all",
  operatorName: "",
  operationStatus: "all",
};

const operationTypeLabelMap: Record<string, string> = {
  CREATE: "新增",
  UPDATE: "修改",
  DELETE: "删除",
  QUERY: "查询",
  EXPORT: "导出",
  IMPORT: "导入",
  LOGIN: "登录",
  LOGOUT: "退出",
};

const isDev = Boolean((import.meta as ViteImportMeta).env?.DEV);

function getErrorMessage(error: unknown, fallback: string) {
  if (isApiError(error)) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

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

function getStatusMeta(status: string) {
  if (status === "SUCCESS") {
    return { label: "成功", tone: "success" as const };
  }

  if (status === "FAIL" || status === "FAILED" || status === "ERROR") {
    return { label: "失败", tone: "error" as const };
  }

  return { label: status || "-", tone: "neutral" as const };
}

function getOperationTypeLabel(type: string) {
  return operationTypeLabelMap[type] ?? type ?? "-";
}

function stringifySummary(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "string") return value;

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function getDetailSummary(detail: OperLogDetail | null, keys: string[]) {
  if (!detail) return "-";
  const record = detail as Record<string, unknown>;
  const value = keys.map((key) => record[key]).find((item) => item);
  return stringifySummary(value);
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

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getOperLogPage(buildQuery(appliedFilters, page, pageSize));
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

  const columns = useMemo<DataTableColumn<OperLogRecord>[]>(
    () => [
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
        render: (value) => (
          <StatusTag tone="info">{getOperationTypeLabel(String(value || ""))}</StatusTag>
        ),
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
          const meta = getStatusMeta(String(value ?? ""));
          return <StatusTag tone={meta.tone}>{meta.label}</StatusTag>;
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
          <span className="tabular-nums">{String(value || "-")}</span>
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
    ],
    [detailLoadingId],
  );

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
            <option value="CREATE">新增</option>
            <option value="UPDATE">修改</option>
            <option value="DELETE">删除</option>
            <option value="QUERY">查询</option>
            <option value="EXPORT">导出</option>
            <option value="IMPORT">导入</option>
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
            <option value="SUCCESS">成功</option>
            <option value="FAIL">失败</option>
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

function OperLogDetailDialog({
  open,
  detail,
  loading,
  onCancel,
}: {
  open: boolean;
  detail: OperLogDetail | null;
  loading: boolean;
  onCancel: () => void;
}) {
  if (!open || typeof document === "undefined") return null;

  const statusMeta = getStatusMeta(detail?.operationStatus ?? "");
  const requestSummary = getDetailSummary(detail, [
    "requestParams",
    "requestParam",
    "requestBody",
  ]);
  const responseSummary = getDetailSummary(detail, [
    "responseResult",
    "responseData",
  ]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 px-4 py-6">
      <section
        className="max-h-[calc(100vh-48px)] w-full max-w-[860px] overflow-hidden rounded-admin border border-border bg-surface shadow-admin"
        role="dialog"
        aria-modal="true"
        aria-labelledby="oper-log-detail-title"
      >
        <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <h2
              id="oper-log-detail-title"
              className="text-base font-semibold text-text-primary"
            >
              操作日志详情
            </h2>
            <p className="mt-1 text-[13px] text-text-tertiary">
              {loading ? "详情加载中" : `记录 ID：${detail?.id ?? "-"}`}
            </p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0"
            onClick={onCancel}
            aria-label="关闭操作日志详情"
          >
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </header>
        <div className="max-h-[calc(100vh-150px)] overflow-y-auto px-5 py-5">
          <div className="grid gap-4 md:grid-cols-3">
            <DetailItem label="模块" value={detail?.moduleName} />
            <DetailItem
              label="操作类型"
              value={getOperationTypeLabel(detail?.operationType ?? "")}
            />
            <DetailItem
              label="操作状态"
              value={<StatusTag tone={statusMeta.tone}>{statusMeta.label}</StatusTag>}
            />
            <DetailItem label="请求方法" value={detail?.requestMethod} />
            <DetailItem
              label="请求地址"
              value={detail?.requestUrl}
              className="md:col-span-2"
            />
            <DetailItem label="操作人" value={detail?.operatorName} />
            <DetailItem label="操作 IP" value={detail?.operatorIp} />
            <DetailItem
              label="耗时"
              value={`${detail?.costTime ?? 0} ms`}
            />
            <DetailItem label="操作时间" value={detail?.operationTime} />
            <DetailItem
              label="异常信息"
              value={detail?.errorMessage}
              className="md:col-span-2"
            />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <SummaryBlock title="请求参数摘要" value={requestSummary} />
            <SummaryBlock title="响应结果摘要" value={responseSummary} />
          </div>
        </div>
      </section>
    </div>,
    document.body,
  );
}

function DetailItem({
  label,
  value,
  className,
}: {
  label: string;
  value?: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="text-[13px] text-text-tertiary">{label}</div>
      <div className="mt-1 break-words text-sm text-text-primary">
        {value || "-"}
      </div>
    </div>
  );
}

function SummaryBlock({ title, value }: { title: string; value: string }) {
  return (
    <div>
      <div className="text-[13px] text-text-tertiary">{title}</div>
      <pre className="mt-2 max-h-64 overflow-auto rounded-lg border border-border bg-slate-50 p-3 text-[13px] leading-5 text-text-secondary">
        {value}
      </pre>
    </div>
  );
}
