"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { LockKeyhole } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { login } from "@/features/auth/auth.api";
import { useAuthStore } from "@/features/auth/auth.store";
import { Button } from "@/management/components/ui/Button";
import { Card } from "@/management/components/ui/Card";
import { Input } from "@/management/components/ui/Input";

const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});

type LoginForm = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSession = useAuthStore((state) => state.setSession);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "admin@example.com",
      password: "password",
    },
  });

  const onSubmit = async (values: LoginForm) => {
    setFormError(null);
    try {
      const session = await login(values);
      setSession(session);
      router.replace(searchParams.get("next") ?? "/management/dashboard");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Đăng nhập thất bại");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md p-6">
        <div className="mb-6">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-slate-900 text-white">
            <LockKeyhole className="h-5 w-5" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-950">Admin Login</h1>
          <p className="mt-1 text-sm text-slate-500">Đăng nhập để quản trị hệ thống Maternity Care.</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register("password")}
          />

          {formError ? <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div> : null}

          <Button className="w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Đang đăng nhập..." : "Login"}
          </Button>
        </form>
      </Card>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">Loading...</main>}>
      <LoginForm />
    </Suspense>
  );
}
