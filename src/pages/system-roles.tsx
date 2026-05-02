import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, ChevronRight, Plus, RotateCcw, Search } from "lucide-react";
import {
  getMenuTree,
  getPermissionTotal,
  getPermissions,
  getRolePermissionDetail,
  getRoleTotal,
  getRoles,
} from "@/api/rbac";
import { DataTable } from "@/components/common/data-table";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { SearchFilterBar } from "@/components/common/search-filter-bar";
import { StatusTag } from "@/components/common/status-tag";
import { TableToolbar } from "@/components/common/table-toolbar";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type {
  DataTableColumn,
  MenuRecord,
  PermissionRecord,
  RoleDataScope,
  RolePermissionDetail,
  RoleRecord,
  RoleStatus,
} from "@/types";

const statusMeta = {
  enabled: { label: "启用", tone: "success" },
  disabled: { label: "停用", tone: "neutral" },
} as const;

const dataScopeLabelMap: Record<RoleDataScope, string> = {
  all: "全部数据",
  custom: "自定义数据",
  department: "本部门数据",
  department_and_sub: "本部门及子部门",
};

const permissionTypeLabelMap: Record<PermissionRecord["type"], string> = {
  page: "页面",
  button: "按钮",
  api: "接口",
  data: "数据",
};

type MenuTreeRow = MenuRecord & { level: number };

type PermissionGroup = {
  menuName: string;
  items: PermissionRecord[];
};

function flattenMenuTree(items: MenuRecord[], level = 0): MenuTreeRow[] {
  return items.flatMap((item) => {
    const row: MenuTreeRow = {
      ...item,
      level,
    };

    const nextRows = item.children?.length
      ? flattenMenuTree(item.children, level + 1)
      : [];
    return [row, ...nextRows];
  });
}

function buildPermissionGroups(items: PermissionRecord[]): PermissionGroup[] {
  const grouped = items.reduce<Record<string, PermissionRecord[]>>(
    (accumulator, item) => {
      const key = item.menuName || "未分组";
      if (!accumulator[key]) {
        accumulator[key] = [];
      }
      accumulator[key].push(item);
      return accumulator;
    },
    {},
  );

  return Object.entries(grouped).map(([menuName, groupItems]) => ({
    menuName,
    items: groupItems,
  }));
}

function MenuTreeItem({
  item,
  selectedIds,
  onToggle,
}: {
  item: MenuTreeRow;
  selectedIds: Set<number>;
  onToggle: (id: number) => void;
}) {
  const hasChildren = Boolean(item.children?.length);
  const checked = selectedIds.has(item.id);

  return (
    <div className="space-y-2">
      <label
        className="flex items-start gap-2 rounded-lg border border-border bg-surface px-3 py-2 transition-colors hover:bg-slate-50"
        style={{ marginLeft: item.level * 20 }}
      >
        <Checkbox
          checked={checked}
          onChange={() => onToggle(item.id)}
          className="mt-0.5"
        />
        <span className="flex min-w-0 flex-1 items-start gap-2">
          <span className="flex items-center gap-1 text-xs text-text-tertiary">
            {hasChildren ? (
              <ChevronDown className="h-3.5 w-3.5" aria-hidden />
            ) : item.level > 0 ? (
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <Check className="h-3.5 w-3.5 opacity-0" aria-hidden />
            )}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-medium text-text-primary">
              {item.name}
            </span>
            <span className="mt-1 block text-xs text-text-tertiary">
              {item.type} · {item.permission || "无权限标识"}
            </span>
          </span>
        </span>
      </label>
      {item.children?.length ? (
        <div className="space-y-2">
          {item.children.map((child) => (
            <MenuTreeItem
              key={child.id}
              item={{ ...child, level: item.level + 1 }}
              selectedIds={selectedIds}
              onToggle={onToggle}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function SystemRolesPage() {
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<RoleStatus | "all">("all");
  const [dataScope, setDataScope] = useState<RoleDataScope | "all">("all");
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [assignmentMessage, setAssignmentMessage] = useState("");
  const [selectedRoleDetail, setSelectedRoleDetail] =
    useState<RolePermissionDetail | null>(null);
  const [menuTree, setMenuTree] = useState<MenuRecord[]>([]);
  const [permissionList, setPermissionList] = useState<PermissionRecord[]>([]);
  const [selectedMenuIds, setSelectedMenuIds] = useState<number[]>([]);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>(
    [],
  );
  const total = getRoleTotal();

  const loadRoles = useCallback(async () => {
    setLoading(true);
    const data = await getRoles({ keyword, status, dataScope });
    setRoles(data);
    setLoading(false);
  }, [dataScope, keyword, status]);

  useEffect(() => {
    void loadRoles();
  }, [loadRoles]);

  const reset = () => {
    setKeyword("");
    setStatus("all");
    setDataScope("all");
  };

  const openAssignment = useCallback(async (role: RoleRecord) => {
    setAssignmentOpen(true);
    setAssignmentLoading(true);
    setAssignmentMessage("");

    const [detail, menus, permissions] = await Promise.all([
      getRolePermissionDetail(role.id),
      getMenuTree(),
      getPermissions({ status: "all" }),
    ]);

    setSelectedRoleDetail(detail);
    setMenuTree(menus);
    setPermissionList(permissions);
    setSelectedMenuIds(detail?.menuIds ?? []);
    setSelectedPermissionIds(detail?.permissionIds ?? []);
    setAssignmentLoading(false);
  }, []);

  const closeAssignment = () => {
    setAssignmentOpen(false);
    setSelectedRoleDetail(null);
    setAssignmentMessage("");
    setSelectedMenuIds([]);
    setSelectedPermissionIds([]);
  };

  const toggleMenu = (id: number) => {
    setSelectedMenuIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  const togglePermission = (id: number) => {
    setSelectedPermissionIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  const saveAssignment = () => {
    setAssignmentMessage("保存成功，当前仅更新前端占位状态，未请求后端接口。");
  };

  const groupedPermissions = useMemo(
    () => buildPermissionGroups(permissionList),
    [permissionList],
  );
  const menuRows = useMemo(() => flattenMenuTree(menuTree), [menuTree]);
  const selectedMenuIdSet = useMemo(() => new Set(selectedMenuIds), [selectedMenuIds]);
  const selectedPermissionIdSet = useMemo(
    () => new Set(selectedPermissionIds),
    [selectedPermissionIds],
  );

  const columns: DataTableColumn<RoleRecord>[] = [
    {
      title: "角色名称",
      key: "name",
      render: (_, record) => (
        <div>
          <div className="font-medium text-text-primary">{record.name}</div>
          <div className="text-xs text-text-tertiary">{record.code}</div>
        </div>
      ),
    },
    {
      title: "角色编码",
      dataIndex: "code",
      width: 180,
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 100,
      render: (value) => {
        const meta = statusMeta[value as RoleStatus];
        return <StatusTag tone={meta.tone}>{meta.label}</StatusTag>;
      },
    },
    {
      title: "数据范围",
      dataIndex: "dataScope",
      width: 160,
      render: (value) => dataScopeLabelMap[value as RoleDataScope],
    },
    {
      title: "用户数量",
      dataIndex: "userCount",
      align: "center",
      width: 100,
    },
    {
      title: "排序",
      dataIndex: "sort",
      align: "center",
      width: 90,
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
      render: (_, record) => (
        <div className="inline-flex flex-wrap items-center gap-2">
          <Button size="sm" variant="ghost">
            编辑
          </Button>
          <Button size="sm" variant="ghost" onClick={() => void openAssignment(record)}>
            分配权限
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
        title="角色管理"
        description="维护系统角色，当前使用前端 mock 数据，不做真实 RBAC 控制。"
        actions={
          <Button variant="primary">
            <Plus className="h-4 w-4" aria-hidden />
            新增角色
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
            placeholder="搜索角色名称或编码"
            className="pl-9"
          />
        </div>
        <Select
          value={status}
          onChange={(event) => setStatus(event.target.value as RoleStatus | "all")}
          aria-label="筛选状态"
        >
          <option value="all">全部状态</option>
          <option value="enabled">启用</option>
          <option value="disabled">停用</option>
        </Select>
        <Select
          value={dataScope}
          onChange={(event) =>
            setDataScope(event.target.value as RoleDataScope | "all")
          }
          aria-label="筛选数据范围"
        >
          <option value="all">全部范围</option>
          <option value="custom">自定义数据</option>
          <option value="department">本部门数据</option>
          <option value="department_and_sub">本部门及子部门</option>
        </Select>
      </SearchFilterBar>

      <section className="rounded-admin border border-border bg-surface shadow-admin">
        <TableToolbar
          title="角色列表"
          description={`共 ${total} 条 mock 数据，当前显示 ${roles.length} 条。`}
          actions={
            <StatusTag tone={loading ? "warning" : "info"}>
              {loading ? "加载中" : "加载完成"}
            </StatusTag>
          }
        />
        <DataTable<RoleRecord>
          columns={columns}
          dataSource={roles}
          rowKey="id"
          loading={loading}
          minWidth={1160}
          empty={
            <EmptyState
              title="暂无角色"
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

      {assignmentOpen && (
        <section className="mt-6 rounded-admin border border-border bg-surface shadow-admin">
          <div className="flex flex-col gap-3 border-b border-border px-5 py-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-base font-semibold text-text-primary">
                分配权限
              </h2>
              <p className="mt-1 text-[13px] text-text-tertiary">
                当前仅为前端占位能力，保存后不请求后端接口。
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={closeAssignment}>
                取消
              </Button>
              <Button variant="primary" onClick={saveAssignment}>
                保存
              </Button>
            </div>
          </div>

          <div className="border-b border-border px-5 py-4">
            {selectedRoleDetail ? (
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-lg border border-border px-4 py-3">
                  <div className="text-xs text-text-tertiary">角色名称</div>
                  <div className="mt-1 font-medium text-text-primary">
                    {selectedRoleDetail.roleName}
                  </div>
                </div>
                <div className="rounded-lg border border-border px-4 py-3">
                  <div className="text-xs text-text-tertiary">角色编码</div>
                  <div className="mt-1 font-medium text-text-primary">
                    {selectedRoleDetail.roleCode}
                  </div>
                </div>
                <div className="rounded-lg border border-border px-4 py-3">
                  <div className="text-xs text-text-tertiary">数据范围</div>
                  <div className="mt-1 font-medium text-text-primary">
                    {dataScopeLabelMap[selectedRoleDetail.dataScope]}
                  </div>
                </div>
                <div className="rounded-lg border border-border px-4 py-3">
                  <div className="text-xs text-text-tertiary">状态</div>
                  <div className="mt-2">
                    <StatusTag tone={selectedRoleDetail.status === "enabled" ? "success" : "neutral"}>
                      {selectedRoleDetail.status === "enabled" ? "启用" : "停用"}
                    </StatusTag>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState
                title="暂无角色信息"
                description="请选择一个角色后进行权限分配。"
              />
            )}
          </div>

          <div className="grid gap-6 px-5 py-5 xl:grid-cols-2">
            <div className="rounded-admin border border-border">
              <div className="border-b border-border px-4 py-3">
                <div className="text-sm font-semibold text-text-primary">
                  菜单权限树
                </div>
                <div className="mt-1 text-[13px] text-text-tertiary">
                  目录、菜单、按钮三级结构，当前仅做勾选占位。
                </div>
              </div>
              <div className="space-y-3 p-4">
                {assignmentLoading ? (
                  <div className="space-y-3">
                    <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
                    <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
                    <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
                  </div>
                ) : (
                  menuRows.map((item) => (
                    <MenuTreeItem
                      key={item.id}
                      item={item}
                      selectedIds={selectedMenuIdSet}
                      onToggle={toggleMenu}
                    />
                  ))
                )}
              </div>
            </div>

            <div className="rounded-admin border border-border">
              <div className="border-b border-border px-4 py-3">
              <div className="text-sm font-semibold text-text-primary">
                  权限点列表
                </div>
                <div className="mt-1 text-[13px] text-text-tertiary">
                  按所属菜单分组展示，当前共 {getPermissionTotal()} 条权限点，已选中{" "}
                  {selectedPermissionIds.length} 条。
                </div>
              </div>
              <div className="space-y-4 p-4">
                {assignmentLoading ? (
                  <div className="space-y-3">
                    <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
                    <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
                    <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
                  </div>
                ) : (
                  groupedPermissions.map((group) => (
                    <div
                      key={group.menuName}
                      className="rounded-lg border border-border"
                    >
                      <div className="border-b border-border bg-slate-50 px-4 py-2.5 text-sm font-medium text-text-primary">
                        {group.menuName}
                      </div>
                      <div className="space-y-2 p-4">
                        {group.items.map((permission) => (
                          <label
                            key={permission.id}
                            className="flex items-start gap-3 rounded-lg border border-border px-3 py-2 transition-colors hover:bg-slate-50"
                          >
                            <Checkbox
                              checked={selectedPermissionIdSet.has(permission.id)}
                              onChange={() => togglePermission(permission.id)}
                              className="mt-0.5"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center gap-2">
                                <span className="text-sm font-medium text-text-primary">
                                  {permission.name}
                                </span>
                                <StatusTag tone={permission.status === "enabled" ? "success" : "neutral"}>
                                  {permission.status === "enabled" ? "启用" : "停用"}
                                </StatusTag>
                              </span>
                              <span className="mt-1 block text-xs text-text-tertiary">
                                {permission.code} · {permissionTypeLabelMap[permission.type]}
                              </span>
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {assignmentMessage && (
            <div className="border-t border-border px-5 py-4 text-sm text-success">
              {assignmentMessage}
            </div>
          )}
        </section>
      )}
    </>
  );
}
