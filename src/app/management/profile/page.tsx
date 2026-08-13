"use client";

import { App } from "antd";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Save, ShieldCheck, UserRound } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuthStore } from "@/features/auth/auth.store";
import {
  changeManagementPassword,
  updateManagementProfile,
} from "@/features/profile/profile.api";
import useAuth from "@/hooks/useAuth";
import { AdminLayout } from "@/management/components/layouts/AdminLayout";
import { Badge } from "@/management/components/ui/Badge";
import { Button } from "@/management/components/ui/Button";
import { Card, CardTitle } from "@/management/components/ui/Card";
import { Input } from "@/management/components/ui/Input";
import { PageHeader } from "@/management/components/ui/PageHeader";
import { StateBlock } from "@/management/components/ui/StateBlock";

const profileSchema = z.object({
  name: z.string().trim().min(1, "Vui lòng nhập họ tên"),
  phone: z
    .string()
    .trim()
    .regex(/^(?:\+84|0)[35789]\d{8}$/, "Số điện thoại Việt Nam không hợp lệ"),
  personalEmail: z.string().trim().email("Email cá nhân không hợp lệ"),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
    newPassword: z.string().min(8, "Mật khẩu mới phải có ít nhất 8 ký tự"),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu mới"),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

function ManagementProfileContent() {
  const { message } = App.useApp();
  const { currentUser, mutate } = useAuth();
  const setUser = useAuthStore((state) => state.setUser);
  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  });
  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    if (!currentUser) return;
    profileForm.reset({
      name: currentUser.name,
      phone: currentUser.phone ?? "",
      personalEmail: currentUser.personalEmail ?? currentUser.email,
    });
  }, [currentUser, profileForm]);

  if (!currentUser) {
    return <StateBlock type="loading" title="Đang tải hồ sơ" />;
  }

  const submitProfile = profileForm.handleSubmit(async (values) => {
    try {
      const response = await updateManagementProfile(values);
      const updated = { ...currentUser, ...response.data };
      setUser(updated);
      await mutate(updated, { revalidate: false });
      void message.success(response.message ?? "Cập nhật hồ sơ thành công.");
    } catch (error) {
      void message.error(
        error instanceof Error ? error.message : "Không cập nhật được hồ sơ.",
      );
    }
  });

  const submitPassword = passwordForm.handleSubmit(async (values) => {
    try {
      const response = await changeManagementPassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      passwordForm.reset();
      void message.success(response.message ?? "Đổi mật khẩu thành công.");
    } catch (error) {
      void message.error(
        error instanceof Error ? error.message : "Không đổi được mật khẩu.",
      );
    }
  });

  return (
    <>
      <PageHeader
        title="Hồ sơ cá nhân"
        description="Quản lý thông tin và bảo mật tài khoản management."
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <Card>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-600 text-white">
                <UserRound className="h-5 w-5" aria-hidden="true" />
              </div>
              <CardTitle>Thông tin cá nhân</CardTitle>
            </div>
            <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={submitProfile}>
              <Input
                label="Họ tên"
                error={profileForm.formState.errors.name?.message}
                {...profileForm.register("name")}
              />
              <Input label="Email đăng nhập" value={currentUser.email} disabled />
              <Input
                label="Số điện thoại"
                inputMode="tel"
                placeholder="0901234567"
                error={profileForm.formState.errors.phone?.message}
                {...profileForm.register("phone")}
              />
              <Input
                label="Email cá nhân"
                type="email"
                error={profileForm.formState.errors.personalEmail?.message}
                {...profileForm.register("personalEmail")}
              />
              <div className="md:col-span-2">
                <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                  <Save className="h-4 w-4" aria-hidden="true" />
                  {profileForm.formState.isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
              </div>
            </form>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-950 text-white">
                <KeyRound className="h-5 w-5" aria-hidden="true" />
              </div>
              <CardTitle>Đổi mật khẩu</CardTitle>
            </div>
            <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={submitPassword}>
              <Input
                label="Mật khẩu hiện tại"
                type="password"
                autoComplete="current-password"
                error={passwordForm.formState.errors.currentPassword?.message}
                {...passwordForm.register("currentPassword")}
              />
              <div className="hidden md:block" />
              <Input
                label="Mật khẩu mới"
                type="password"
                autoComplete="new-password"
                error={passwordForm.formState.errors.newPassword?.message}
                {...passwordForm.register("newPassword")}
              />
              <Input
                label="Xác nhận mật khẩu mới"
                type="password"
                autoComplete="new-password"
                error={passwordForm.formState.errors.confirmPassword?.message}
                {...passwordForm.register("confirmPassword")}
              />
              <div className="md:col-span-2">
                <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
                  <KeyRound className="h-4 w-4" aria-hidden="true" />
                  {passwordForm.formState.isSubmitting ? "Đang cập nhật..." : "Đổi mật khẩu"}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        <Card className="xl:self-start">
          <div className="flex h-14 w-14 items-center justify-center rounded-md bg-slate-950 text-white">
            <ShieldCheck className="h-7 w-7" aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-950">
            {currentUser.name}
          </h2>
          <p className="mt-1 text-sm text-slate-500">{currentUser.email}</p>
          <div className="mt-5 space-y-4 border-t border-slate-200 pt-5 text-sm">
            <div>
              <p className="text-slate-500">Mã nhân viên</p>
              <p className="mt-1 font-medium text-slate-950">
                {currentUser.employeeCode ?? "-"}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Cơ sở làm việc</p>
              <p className="mt-1 font-medium text-slate-950">
                {currentUser.address ?? "-"}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Trạng thái</p>
              <Badge tone={currentUser.status === "active" ? "green" : "neutral"}>
                {currentUser.status === "active" ? "Hoạt động" : "Tạm khóa"}
              </Badge>
            </div>
            <div>
              <p className="text-slate-500">Quyền hiện tại</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {useAuthStore.getState().roles.map((role) => (
                  <Badge key={role}>{role}</Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

export default function ProfilePage() {
  return (
    <AdminLayout roles={["super_admin", "admin", "doctor", "nurse", "staff"]}>
      <ManagementProfileContent />
    </AdminLayout>
  );
}
