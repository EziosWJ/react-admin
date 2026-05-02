import { useState } from "react";
import { KeyRound, RotateCcw, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ContentCard } from "@/components/common/content-card";
import { Field } from "@/components/common/field";
import { FormSection } from "@/components/common/form-section";
import { PageHeader } from "@/components/common/page-header";
import { StatusTag } from "@/components/common/status-tag";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "请输入当前密码"),
    newPassword: z
      .string()
      .min(6, "新密码不少于 6 位")
      .max(32, "新密码不能超过 32 个字符"),
    confirmPassword: z.string().min(1, "请再次输入新密码"),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "两次输入的新密码不一致",
  })
  .refine((values) => values.currentPassword !== values.newPassword, {
    path: ["newPassword"],
    message: "新密码不能与当前密码相同",
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

const defaultValues: PasswordFormValues = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export function ChangePasswordPage() {
  const [message, setMessage] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues,
    mode: "onBlur",
  });

  const onSubmit = async (values: PasswordFormValues) => {
    setMessage("");
    await new Promise((resolve) => window.setTimeout(resolve, 500));
    void values;
    reset(defaultValues);
    setMessage("密码修改成功，当前为前端 mock 提示。");
  };

  const handleReset = () => {
    reset(defaultValues);
    setMessage("");
  };

  return (
    <>
      <PageHeader
        title="修改密码"
        description="修改当前登录账号密码，仅做前端校验和成功提示。"
      />

      <div className="grid max-w-[1120px] gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <ContentCard title="安全提示">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-primary">
              <KeyRound className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <div className="font-medium text-text-primary">密码规则</div>
              <p className="mt-1 text-sm text-text-tertiary">
                原密码必填，新密码不少于 6 位，确认密码必须与新密码一致。
              </p>
              <div className="mt-3">
                <StatusTag tone="info">前端校验</StatusTag>
              </div>
            </div>
          </div>
        </ContentCard>

        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
          <FormSection title="密码信息" description="提交后仅展示前端成功提示。">
            <div className="md:col-span-2">
              <Field
                label="当前密码"
                htmlFor="currentPassword"
                required
                error={errors.currentPassword?.message}
              >
                <Input
                  id="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  {...register("currentPassword")}
                />
              </Field>
            </div>

            <Field
              label="新密码"
              htmlFor="newPassword"
              required
              error={errors.newPassword?.message}
            >
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                disabled={isSubmitting}
                {...register("newPassword")}
              />
            </Field>

            <Field
              label="确认新密码"
              htmlFor="confirmPassword"
              required
              error={errors.confirmPassword?.message}
            >
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                disabled={isSubmitting}
                {...register("confirmPassword")}
              />
            </Field>
          </FormSection>

          <div className="flex flex-col gap-3 rounded-admin border border-border bg-surface px-5 py-4 shadow-admin md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-text-tertiary">
              {message || "提交后仅进行本地校验和静态反馈，不请求真实接口。"}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={handleReset}
                disabled={isSubmitting}
              >
                <RotateCcw className="h-4 w-4" aria-hidden />
                重置
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                <Save className="h-4 w-4" aria-hidden />
                {isSubmitting ? "提交中..." : "提交"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
