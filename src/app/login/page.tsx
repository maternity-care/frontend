"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { HeartPulse } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { login } from "@/features/auth/auth.api";
import { useAuthStore } from "@/features/auth/auth.store";
import { Button } from "@/fe/components/ui/Button";
import { Input } from "@/fe/components/ui/Input";
import { Panel } from "@/fe/components/ui/Panel";

const schema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});

type LoginFormValues = z.infer<typeof schema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSession = useAuthStore((state) => state.setSession);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "admin@example.com", password: "password" },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setFormError(null);
    try {
      const session = await login(values);
      setSession(session);
      router.replace(searchParams.get("next") ?? "/profile");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Đăng nhập thất bại");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-teal-50 px-4">
      <Panel className="w-full max-w-md">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 font-semibold text-teal-900">
          <HeartPulse className="h-5 w-5" />
          Maternity Care
        </Link>
        <h1 className="text-2xl font-semibold text-slate-950">Đăng nhập tài khoản</h1>
        <p className="mt-2 text-sm text-slate-600">Dùng tài khoản của bạn để truy cập hồ sơ và uploads.</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
          <Input label="Password" type="password" autoComplete="current-password" error={errors.password?.message} {...register("password")} />
          {formError ? <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div> : null}
          <Button className="w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Đang đăng nhập..." : "Login"}
          </Button>
        </form>
      </Panel>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-teal-50">Loading...</main>}>
      <LoginForm />
    </Suspense>
  );
}
