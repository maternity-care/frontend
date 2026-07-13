"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/features/auth/auth.store";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { ArrowLeft, LoaderCircle, ShieldX } from "lucide-react";

const subscribeMounted = () => () => {};
const getMountedSnapshot = () => true;
const getServerMountedSnapshot = () => false;

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
  permissions?: string[];
}

function ProtectedRouteContent({
  children,
  roles = ["super_admin", "admin"],
  permissions = [],
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const mounted = useSyncExternalStore(subscribeMounted, getMountedSnapshot, getServerMountedSnapshot);
  const { accessToken, clearSession } = useAuthStore();
  const { currentUser, loading, hasRole, hasPermission } = useAuth();

  useEffect(() => {
    if (!mounted) return;

    if (!accessToken) {
      clearSession();
      router.replace(`/management/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [accessToken, clearSession, mounted, pathname, router]);

  if (!mounted) {
    return null;
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <section className="w-full max-w-sm text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-cyan-700 shadow-sm ring-1 ring-slate-200">
            <LoaderCircle
              className="h-8 w-8 animate-spin"
              aria-hidden="true"
            />
          </div>
          <h1 className="mt-6 text-lg font-semibold text-slate-950">
            Đang kiểm tra phiên đăng nhập
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Đang tải tài khoản, cơ sở làm việc và quyền truy cập.
          </p>
        </section>
      </main>
    );
  }

  if (!currentUser) {
    return null;
  }

  const roleAllowed = roles.length === 0 || hasRole(...roles);
  const permissionAllowed = permissions.length === 0 || hasPermission(...permissions);

  if (!roleAllowed || !permissionAllowed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
        <section className="w-full max-w-lg rounded-lg border border-slate-200 bg-white px-6 py-10 text-center shadow-[0_20px_60px_rgba(15,23,42,0.12)] sm:px-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600 ring-8 ring-red-50/60">
            <ShieldX className="h-8 w-8" aria-hidden="true" />
          </div>
          <p className="mt-7 text-sm font-semibold uppercase text-red-600">
            403 Forbidden
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">
            Không có quyền truy cập
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">
            Tài khoản hiện tại không có role hoặc permission phù hợp với khu
            vực này.
          </p>
          <Link
            href="/management/dashboard"
            className="mt-7 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Về Dashboard
          </Link>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}

export function ProtectedRoute(props: ProtectedRouteProps) {
  return (
    <AuthProvider>
      <ProtectedRouteContent {...props} />
    </AuthProvider>
  );
}
