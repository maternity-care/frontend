"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/features/auth/auth.store";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { State } from "@/fe/components/ui/State";

const subscribeMounted = () => () => {};
const getMountedSnapshot = () => true;
const getServerMountedSnapshot = () => false;

function AuthGuardContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const mounted = useSyncExternalStore(subscribeMounted, getMountedSnapshot, getServerMountedSnapshot);
  const { accessToken, clearSession } = useAuthStore();
  const { currentUser, loading } = useAuth();

  useEffect(() => {
    if (!mounted) return;

    if (!accessToken) {
      clearSession();
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [accessToken, clearSession, mounted, pathname, router]);

  if (!mounted) return null;
  if (loading) return <State type="loading" title="Đang kiểm tra đăng nhập" />;
  if (!currentUser) return null;

  return <>{children}</>;
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGuardContent>{children}</AuthGuardContent>
    </AuthProvider>
  );
}
