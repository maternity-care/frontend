"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  HeartPulse,
  LogOut,
  ShoppingCart,
  Upload,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";

import { logout as logoutApi } from "@/features/auth/auth.api";
import { useAuthStore } from "@/features/auth/auth.store";
import { Button } from "@/fe/components/ui/Button";
import useSetting from "@/hooks/useSetting";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, refreshToken, clearSession } = useAuthStore();
  const { getOrDefault } = useSetting();

  const siteName = getOrDefault("site_name", getOrDefault("app_name", "Maternity Care"));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLoggedIn = Boolean(user || refreshToken);

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
    <div className="min-h-screen bg-pink-50">
      <header className="sticky top-0 z-50 border-b border-pink-100 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold !text-pink-900">
            <HeartPulse className="h-5 w-5 !text-pink-700" />
            {siteName}
          </Link>

          <nav className="flex items-center gap-2">
            {!mounted ? (
              <div className="h-11 w-32" />
            ) : isLoggedIn ? (
              <>
                <Link
                  className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-medium !text-slate-700 hover:bg-pink-50 sm:flex"
                  href="/profile"
                >
                  <UserRound className="h-4 w-4" />
                  {user?.name ?? "Hồ sơ"}
                </Link>

                <Link
                  className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-medium !text-slate-700 hover:bg-pink-50 sm:flex"
                  href="/uploads"
                >
                  <Upload className="h-4 w-4" />
                  Upload
                </Link>

                <Button variant="light" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  aria-label="Giỏ hàng"
                  onClick={() => router.push("/login")}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-pink-700 transition hover:bg-pink-50"
                >
                  <ShoppingCart className="h-5 w-5" />
                </button>

                <Button variant="light" onClick={() => router.push("/login")}>
                  Đăng nhập
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}