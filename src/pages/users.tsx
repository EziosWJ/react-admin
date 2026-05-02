import { useCallback, useEffect, useState } from "react";
import { Plus, RotateCcw, Search } from "lucide-react";
import { getUserList, getUserTotal } from "@/api/user";
import { DataTable } from "@/components/common/data-table";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { SearchFilterBar } from "@/components/common/search-filter-bar";
import { StatusTag } from "@/components/common/status-tag";
import { TableToolbar } from "@/components/common/table-toolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { DataTableColumn, UserRecord, UserStatus } from "@/types";

const statusMeta = {
  active: { label: "启用", tone: "success" },
  pending: { label: "待审核", tone: "warning" },
  disabled: { label: "停用", tone: "neutral" },
} as const;

export function UsersPage() {
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<UserStatus | "all">("all");
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const total = getUserTotal();

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const data = await getUserList({ keyword, status });
    setUsers(data);
    setLoading(false);
  }, [keyword, status]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const reset = () => {
    setKeyword("");
    setStatus("all");
  };

  const refresh = () => {
    void loadUsers();
  };

  const columns: DataTableColumn<UserRecord>[] = [
    {
      title: "用户",
      key: "user",
      render: (_, user) => (
        <div>
          <div className="font-medium text-text-primary">{user.name}</div>
          <div className="text-xs text-text-tertiary">
            {user.account} · ID {user.id}
          </div>
        </div>
      ),
    },
    {
      title: "角色",
      dataIndex: "role",
    },
    {
      title: "部门",
      dataIndex: "department",
    },
    {
      title: "状态",
      dataIndex: "status",
      render: (value) => {
        const meta = statusMeta[value as UserRecord["status"]];
        return <StatusTag tone={meta.tone}>{meta.label}</StatusTag>;
      },
    },
    {
      title: "最近登录",
      dataIndex: "lastLogin",
    },
    {
      title: "操作",
      key: "actions",
      align: "center",
      width: 240,
      render: () => (
        <div className="inline-flex items-center gap-2">
          <Button size="sm" variant="ghost">
            编辑
          </Button>
          <Button size="sm" variant="ghost">
            查看
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="用户管理"
        description="列表页示例，展示筛选、表格、状态标签、操作列和分页结构。"
        actions={
          <Button variant="primary">
            <Plus className="h-4 w-4" aria-hidden />
            新建用户
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
            placeholder="搜索姓名、账号或部门"
            className="pl-9"
          />
        </div>
        <Select
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as UserStatus | "all")
          }
          aria-label="筛选状态"
        >
          <option value="all">全部状态</option>
          <option value="active">启用</option>
          <option value="pending">待审核</option>
          <option value="disabled">停用</option>
        </Select>
      </SearchFilterBar>

      <section className="rounded-admin border border-border bg-surface shadow-admin">
        <TableToolbar
          title="用户列表"
          description={`共 ${total} 条 mock 数据，当前显示 ${users.length} 条。`}
          actions={
            <>
              <StatusTag tone={loading ? "warning" : "info"}>
                {loading ? "加载中" : "加载完成"}
              </StatusTag>
              <Button size="sm" variant="secondary" onClick={refresh}>
                刷新
              </Button>
            </>
          }
        />
        <DataTable<UserRecord>
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          empty={
            <EmptyState
              title="暂无匹配数据"
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
