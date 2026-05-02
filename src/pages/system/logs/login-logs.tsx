import { Eye, RefreshCw, RotateCcw, Search, Trash2 } from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";
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
import { toast } from "@/components/common/toast-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatDateTime } from "@/lib/datetime";
import type { DataTableColumn, LoginLogRecord } from "@/types";
import { LoginLogDetailDialog } from "./login-log-detail-dialog";
import { getErrorMessage, getStatusMeta, isDev } from "./utils";

type FilterState = {
  username: string;
  loginIp: string;
  loginStatus: "all" | string;
};

const DEFAULT_FILTERS: FilterState = {
  username: "",
  loginIp: "",
  loginStatus: "all",
};

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

  const columns: DataTableColumn<LoginLogRecord>[] = [
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
      render: (value) => (
        <span className="tabular-nums">{String(value || "-")}</span>
      ),
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
