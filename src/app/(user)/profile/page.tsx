"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AppShell } from "@/fe/components/layout/AppShell";
import { AuthGuard } from "@/fe/components/layout/AuthGuard";
import { Button } from "@/fe/components/ui/Button";
import { Input } from "@/fe/components/ui/Input";
import { Panel } from "@/fe/components/ui/Panel";
import { State } from "@/fe/components/ui/State";
import { useAuthStore } from "@/features/auth/auth.store";
import { updateMyProfile } from "@/features/profile/profile.api";
import type { UserProfile } from "@/features/profile/profile.types";
import useAuth from "@/hooks/useAuth";

const schema = z.object({
  name: z.string().min(1, "Name là bắt buộc"),
});

type ProfileFormValues = z.infer<typeof schema>;

function ProfileContent() {
  const { currentUser, mutate } = useAuth();
  const setStoreUser = useAuthStore((state) => state.setUser);
  const [updatedProfile, setUpdatedProfile] = useState<UserProfile | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const profile = updatedProfile ?? currentUser ?? null;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!currentUser) return;

    reset({ name: currentUser.name });
  }, [currentUser, reset]);

  const onSubmit = async (values: ProfileFormValues) => {
    setError(null);
    setMessage(null);
    try {
      const updated = await updateMyProfile(values);
      setUpdatedProfile(updated);
      setStoreUser(updated);
      await mutate(updated, { revalidate: false });
      setMessage("Đã cập nhật hồ sơ.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không cập nhật được hồ sơ");
    }
  };

  if (!profile) return <State type="error" title="Không tải được hồ sơ" description={error ?? undefined} />;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <Panel>
        <h1 className="text-2xl font-semibold text-slate-950">Hồ sơ cá nhân</h1>
        <p className="mt-2 text-sm text-slate-600">Cập nhật thông tin từ endpoint PATCH /users/me.</p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Input label="Name" error={errors.name?.message} {...register("name")} />
          {message ? <div className="rounded-xl bg-teal-50 px-4 py-3 text-sm text-teal-800">{message}</div> : null}
          {error ? <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
          <Button type="submit" disabled={isSubmitting}>
            <Save className="h-4 w-4" />
            {isSubmitting ? "Đang lưu..." : "Save"}
          </Button>
        </form>
      </Panel>

      <Panel>
        <h2 className="font-semibold text-slate-950">Tài khoản</h2>
        <div className="mt-4 space-y-4 text-sm">
          <div>
            <p className="text-slate-500">Email</p>
            <p className="font-medium text-slate-950">{profile.email}</p>
          </div>
          <div>
            <p className="text-slate-500">Status</p>
            <p className="font-medium text-slate-950">{profile.status === 1 ? "Active" : "Inactive"}</p>
          </div>
          <div>
            <p className="text-slate-500">Roles</p>
            <p className="font-medium text-slate-950">{profile.roles?.map((role) => role.name).join(", ") || "-"}</p>
          </div>
        </div>
      </Panel>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <AppShell>
      <AuthGuard>
        <ProfileContent />
      </AuthGuard>
    </AppShell>
  );
}
