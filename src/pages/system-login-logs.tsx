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
import {
  clearLoginLogs,
  getLoginLogDetail,
  getLoginLogPage,
} from "@/api/log";
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
import { formatDateTime } from "@/lib/datetime";
import { isApiError } from "@/lib/api-error";
import type { DataTableColumn, LoginLogRecord } from "@/types";

type FilterState = {
  username: string;
  loginIp: string;
  loginStatus: "all" | string;
};

type ViteImportMeta = ImportMeta & {
  env?: {
    DEV?: boolean;
  };
};

const DEFAULT_FILTERS: FilterState = {
  username: "",
  loginIp: "",
  loginStatus: "all",
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
    username: filters.username.trim() || undefined,
    loginIp: filters.loginIp.trim() || undefined,
    loginStatus:
      filters.loginStatus === "all" ? undefined : filters.loginStatus,
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

export function SystemLoginLogsPage() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<FilterState>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [logs, setLogs] = useState<LoginLogRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState<LoginLogRecord | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoadingId, setDetailLoadingId] = useState<number | null>(null);
  const [clearOpen, setClearOpen] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getLoginLogPage(
        buildQuery(appliedFilters, page, pageSize),
      );
      setLogs(data.records);
      setTotal(data.total);
    } catch (loadError) {
      setLogs([]);
      setTotal(0);
      setError(getErrorMessage(loadError, "登录日志加载失败"));
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

  const openDetail = async (record: LoginLogRecord) => {
    setDetail(record);
    setDetailOpen(true);
    setDetailLoadingId(record.id);

    try {
      const data = await getLoginLogDetail(record.id);
      setDetail(data);
    } catch (detailError) {
      toast.error({
        title: "登录日志详情加载失败",
        description: getErrorMessage(detailError, "无法获取登录日志详情"),
      });
    } finally {
      setDetailLoadingId(null);
    }
  };

  const runClearLogs = async () => {
    setClearLoading(true);

    try {
      await clearLoginLogs();
      toast.success("登录日志已清空");
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

  const columns = useMemo<DataTableColumn<LoginLogRecord>[]>(
    () => [
      {
        title: "用户",
        key: "user",
        width: 180,
        render: (_, record) => (
          <div>
            <div className="font-medium text-text-primary">
              {record.username || "-"}
            </div>
            <div className="text-xs text-text-tertiary">ID {record.id}</div>
          </div>
        ),
      },
      {
        title: "状态",
        dataIndex: "loginStatus",
        width: 100,
        render: (value) => {
          const meta = getStatusMeta(String(value ?? ""));
          return <StatusTag tone={meta.tone}>{meta.label}</StatusTag>;
        },
      },
      {
        title: "登录 IP",
        dataIndex: "loginIp",
        width: 150,
        render: (value) => <span className="tabular-nums">{String(value || "-")}</span>,
      },
      {
        title: "客户端",
        key: "client",
        width: 220,
        render: (_, record) => (
          <div>
            <div className="text-text-primary">{record.browser || "-"}</div>
            <div className="text-xs text-text-tertiary">{record.os || "-"}</div>
          </div>
        ),
      },
      {
        title: "消息",
        dataIndex: "message",
        render: (value) => (
          <span className="block max-w-[280px] truncate text-text-secondary">
            {String(value || "-")}
          </span>
        ),
      },
      {
        title: "登录时间",
        dataIndex: "loginTime",
        width: 180,
        render: (value) => (
          <span className="whitespace-nowrap tabular-nums">
            {formatDateTime(typeof value === "string" ? value : value ? String(value) : "")}
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
    ],
    [detailLoadingId],
  );

  return (
    <>
      <PageHeader
        title="登录日志"
        description="查看系统用户登录记录，支持按用户、状态和 IP 筛选。"
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
            value={filters.username}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                username: event.target.value,
              }))
            }
            placeholder="搜索用户名"
            aria-label="搜索用户名"
          />
          <Select
            value={filters.loginStatus}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                loginStatus: event.target.value,
              }))
            }
            aria-label="筛选登录状态"
          >
            <option value="all">全部状态</option>
            <option value="SUCCESS">成功</option>
            <option value="FAIL">失败</option>
          </Select>
          <Input
            value={filters.loginIp}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                loginIp: event.target.value,
              }))
            }
            placeholder="搜索登录 IP"
            aria-label="搜索登录 IP"
          />
        </SearchFilterBar>
      </form>

      <section className="rounded-admin border border-border bg-surface shadow-admin">
        <TableToolbar
          title="登录日志列表"
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
        <DataTable<LoginLogRecord>
          columns={columns}
          dataSource={logs}
          rowKey="id"
          loading={loading}
          error={error}
          minWidth={1080}
          empty={
            <EmptyState
              title="暂无登录日志"
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

      <LoginLogDetailDialog
        open={detailOpen}
        detail={detail}
        loading={detailLoadingId !== null}
        onCancel={() => setDetailOpen(false)}
      />

      <ConfirmDialog
        open={clearOpen}
        title="清空登录日志"
        description="确认清空所有登录日志吗？此操作不可恢复。"
        confirmText="清空"
        danger
        loading={clearLoading}
        onConfirm={() => void runClearLogs()}
        onCancel={() => setClearOpen(false)}
      />
    </>
  );
}

function LoginLogDetailDialog({
  open,
  detail,
  loading,
  onCancel,
}: {
  open: boolean;
  detail: LoginLogRecord | null;
  loading: boolean;
  onCancel: () => void;
}) {
  if (!open || typeof document === "undefined") return null;

  const statusMeta = getStatusMeta(detail?.loginStatus ?? "");

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 px-4 py-6">
      <section
        className="w-full max-w-[720px] overflow-hidden rounded-admin border border-border bg-surface shadow-admin"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-log-detail-title"
      >
        <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <h2
              id="login-log-detail-title"
              className="text-base font-semibold text-text-primary"
            >
              登录日志详情
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
            aria-label="关闭登录日志详情"
          >
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </header>
        <div className="grid gap-4 px-5 py-5 md:grid-cols-2">
          <DetailItem label="用户名" value={detail?.username} />
          <DetailItem
            label="登录状态"
            value={<StatusTag tone={statusMeta.tone}>{statusMeta.label}</StatusTag>}
          />
          <DetailItem label="登录 IP" value={detail?.loginIp} />
          <DetailItem label="浏览器" value={detail?.browser} />
          <DetailItem label="操作系统" value={detail?.os} />
          <DetailItem
            label="登录时间"
            value={
              <span className="whitespace-nowrap tabular-nums">
                {formatDateTime(detail?.loginTime)}
              </span>
            }
          />
          <DetailItem label="消息" value={detail?.message} className="md:col-span-2" />
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
