"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { managementLogin } from "@/features/auth/auth.api";
import { useAuthStore } from "@/features/auth/auth.store";
import { Button } from "@/management/components/ui/Button";
import { Card } from "@/management/components/ui/Card";
import { Input } from "@/management/components/ui/Input";
import { RESPONSE_MESSAGES } from "@/constants/response-message.constant";

const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
  rememberMe: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSession = useAuthStore((state) => state.setSession);
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "admin@example.com",
      password: "password",
      rememberMe: true,
    },
  });

  const onSubmit = async (values: LoginForm) => {
    setFormError(null);
    try {
      const session = await managementLogin({
        email: values.email,
        password: values.password,
        rememberMe: Boolean(values.rememberMe),
      });
      setSession(session, Boolean(values.rememberMe));
      router.replace(searchParams.get("next") ?? "/management/dashboard");
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Đăng nhập thất bại",
      );
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
          <p className="mt-1 text-sm text-slate-500">
            {RESPONSE_MESSAGES.AUTH.LOGIN_FOR_MANAGEMENT}
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />
          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              error={errors.password?.message}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-[38px] text-slate-500 hover:text-slate-700 focus:outline-none"
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between gap-4">
            <label className="inline-flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300"
                {...register("rememberMe")}
              />
              {RESPONSE_MESSAGES.AUTH.REMEMBER_LOGIN}
            </label>
            <Link
              href="/management/forgot-password"
              className="text-sm font-medium text-slate-700 hover:text-slate-950 hover:underline"
            >
              {RESPONSE_MESSAGES.AUTH.FORGOT_PASSWORD}
            </Link>
          </div>

          {formError ? (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </div>
          ) : null}

          <Button className="w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>
        </form>
      </Card>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
          Loading...
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
