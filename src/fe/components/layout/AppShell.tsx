"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { HeartPulse, LogOut, Upload, UserRound } from "lucide-react";
import { logout as logoutApi } from "@/features/auth/auth.api";
import { useAuthStore } from "@/features/auth/auth.store";
import { Button } from "@/fe/components/ui/Button";
import useSetting from "@/hooks/useSetting";
import { useEffect, useState } from "react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, refreshToken, clearSession } = useAuthStore();
  const { getOrDefault } = useSetting();
  const siteName = getOrDefault("site_name", getOrDefault("app_name", "Maternity Care"));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    try {
      if (refreshToken) {
        await logoutApi(refreshToken);
      }
    } finally {
      clearSession();
      router.replace("/login");
    }
  };

  return (
    <div className="min-h-screen bg-teal-50">
      <header className="border-b border-teal-100 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold !text-teal-900">
            <HeartPulse className="h-5 w-5 !text-teal-700" />
            {siteName}
          </Link>
          <nav className="flex items-center gap-2">
            <Link className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-medium !text-slate-700 hover:bg-teal-50 sm:flex" href="/profile">
              <UserRound className="h-4 w-4" />
              {user?.name ?? "Hồ sơ"}
            </Link>
            <Link className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-medium !text-slate-700 hover:bg-teal-50 sm:flex" href="/uploads">
              <Upload className="h-4 w-4" />
              Upload
            </Link>
            {/* {user || refreshToken ? (
              <Button variant="light" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            ) : (
              <Link href="/login">
                <Button variant="light">Login</Button>
              </Link>
            )} */}
            {!mounted ? (
              <div className="h-11 w-24" />
            ) : user || refreshToken ? (
              <Button variant="light" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            ) : (
              <Button variant="light" onClick={() => router.push("/login")}>
                Login
              </Button>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
