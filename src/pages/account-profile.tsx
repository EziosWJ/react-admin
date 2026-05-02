import { useEffect, useState } from "react";
import { Mail, Phone, UserRound } from "lucide-react";
import { getAccountProfile } from "@/api/account";
import { ContentCard } from "@/components/common/content-card";
import { PageHeader } from "@/components/common/page-header";
import { StatusTag } from "@/components/common/status-tag";
import { Button } from "@/components/ui/button";
import type { AccountProfile } from "@/types";

function InfoItem({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-lg border border-border px-4 py-3">
      <div className="text-sm text-text-tertiary">{label}</div>
      <div className="mt-1 font-medium text-text-primary">{value || "-"}</div>
    </div>
  );
}

export function AccountProfilePage() {
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      const data = await getAccountProfile();
      setProfile(data);
      setLoading(false);
    }

    void loadProfile();
  }, []);

  return (
    <>
      <PageHeader
        title="个人中心"
        description="查看当前账号的基础资料、联系方式、角色和登录信息。"
        actions={
          <Button variant="secondary" disabled={loading}>
            编辑资料
          </Button>
        }
      />

      <div className="grid max-w-[1120px] gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <ContentCard title="账号概览" bodyClassName="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-primary">
              <UserRound className="h-6 w-6" aria-hidden />
            </div>
            <div>
              <div className="font-semibold text-text-primary">
                {profile?.displayName ?? "加载中"}
              </div>
              <div className="text-sm text-text-tertiary">
                {profile?.username ?? "-"}
              </div>
            </div>
          </div>

          <div className="space-y-3 border-t border-border pt-4 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-text-tertiary">账号状态</span>
              <StatusTag
                tone={profile?.status === "enabled" ? "success" : "neutral"}
              >
                {profile?.status === "enabled" ? "启用" : "停用"}
              </StatusTag>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-text-tertiary">角色编码</span>
              <span className="font-medium text-text-primary">
                {profile?.roleCode ?? "-"}
              </span>
            </div>
          </div>
        </ContentCard>

        <div className="space-y-6">
          <ContentCard
            title="基础信息"
            description="账号基础资料来自前端 mock 数据。"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <InfoItem label="用户名" value={profile?.username} />
              <InfoItem label="姓名" value={profile?.displayName} />
              <InfoItem label="所属部门" value={profile?.department} />
              <InfoItem label="最近登录" value={profile?.lastLogin} />
            </div>
          </ContentCard>

          <ContentCard title="联系方式">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-border px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-text-tertiary">
                  <Mail className="h-4 w-4" aria-hidden />
                  邮箱
                </div>
                <div className="mt-1 font-medium text-text-primary">
                  {profile?.email ?? "-"}
                </div>
              </div>
              <div className="rounded-lg border border-border px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-text-tertiary">
                  <Phone className="h-4 w-4" aria-hidden />
                  手机号
                </div>
                <div className="mt-1 font-medium text-text-primary">
                  {profile?.phone ?? "-"}
                </div>
              </div>
            </div>
          </ContentCard>

          <ContentCard title="角色信息">
            <div className="grid gap-4 md:grid-cols-2">
              <InfoItem label="角色名称" value={profile?.role} />
              <InfoItem label="角色编码" value={profile?.roleCode} />
            </div>
          </ContentCard>
        </div>
      </div>
    </>
  );
}
