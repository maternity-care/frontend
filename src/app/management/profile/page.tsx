"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuthStore } from "@/features/auth/auth.store";
import useAuth from "@/hooks/useAuth";
import { AdminLayout } from "@/management/components/layouts/AdminLayout";
import { Badge } from "@/management/components/ui/Badge";
import { Button } from "@/management/components/ui/Button";
import { Card, CardTitle } from "@/management/components/ui/Card";
import { Input } from "@/management/components/ui/Input";
import { PageHeader } from "@/management/components/ui/PageHeader";
import { StateBlock } from "@/management/components/ui/StateBlock";
import { updateMyProfile } from "@/management/features/users/users.api";
import type { User } from "@/management/features/users/users.types";

const profileSchema = z.object({
  name: z.string().min(1, "Name là bắt buộc"),
});

type ProfileForm = z.infer<typeof profileSchema>;

function ManagementProfileContent() {
  const { currentUser, mutate } = useAuth();
  const setUser = useAuthStore((state) => state.setUser);
  const [updatedProfile, setUpdatedProfile] = useState<User | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const profile = updatedProfile ?? (currentUser as User | undefined) ?? null;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    if (!currentUser) return;

    reset({ name: currentUser.name });
  }, [currentUser, reset]);

  const onSubmit = async (values: ProfileForm) => {
    setError(null);
    setMessage(null);
    try {
      const response = await updateMyProfile(values);
      const updated = response.data;
      setUpdatedProfile(updated);
      setUser(updated);
      await mutate(updated, { revalidate: false });
      setMessage(response.message || "Cập nhật hồ sơ thành công.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không cập nhật được hồ sơ");
    }
  };

  return (
    <>
      <PageHeader title="Profile" description="Quản lý endpoint GET/PATCH /users/me." />

      {profile ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Card>
            <CardTitle>Edit Profile</CardTitle>
            <form className="mt-5 space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <Input label="Name" error={errors.name?.message} {...register("name")} />
              {message ? <div className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</div> : null}
              {error ? <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
              <Button type="submit" disabled={isSubmitting}>
                <Save className="h-4 w-4" />
                {isSubmitting ? "Đang lưu..." : "Save"}
              </Button>
            </form>
          </Card>

          <Card>
            <CardTitle>Account</CardTitle>
            <div className="mt-4 space-y-4 text-sm">
              <div>
                <p className="text-slate-500">Email</p>
                <p className="font-medium text-slate-950">{profile.email}</p>
              </div>
              <div>
                <p className="text-slate-500">Status</p>
                <Badge tone={profile.status === 1 ? "green" : "neutral"}>{profile.status === 1 ? "Active" : "Inactive"}</Badge>
              </div>
              <div>
                <p className="text-slate-500">Roles</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {profile.roles?.length ? profile.roles.map((role) => <Badge key={role.id}>{role.name}</Badge>) : "-"}
                </div>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <StateBlock type="loading" title="Đang tải hồ sơ" />
      )}
    </>
  );
}

export default function ProfilePage() {
  return (
    <AdminLayout>
      <ManagementProfileContent />
    </AdminLayout>
  );
}
