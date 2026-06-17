"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/features/auth/auth.store";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { StateBlock } from "@/management/components/ui/StateBlock";

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
    return <StateBlock type="loading" title="Đang kiểm tra phiên đăng nhập" />;
  }

  if (!currentUser) {
    return null;
  }

  const roleAllowed = roles.length === 0 || hasRole(...roles);
  const permissionAllowed = permissions.length === 0 || hasPermission(...permissions);

  if (!roleAllowed || !permissionAllowed) {
    return (
      <StateBlock
        type="error"
        title="Không có quyền truy cập"
        description="Tài khoản hiện tại không có role hoặc permission phù hợp để vào khu vực management."
      />
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
