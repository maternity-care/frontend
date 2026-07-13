"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import {
  HeartPulse,
  LogOut,
  ShoppingCart,
  Upload,
  UserRound,
} from "lucide-react";

import { logout as logoutApi } from "@/features/auth/auth.api";
import { useAuthStore } from "@/features/auth/auth.store";
import { Button } from "@/fe/components/ui/Button";
import useSetting from "@/hooks/useSetting";
import { RESPONSE_MESSAGES } from "@/constants/response-message.constant";

const subscribeToHydration = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hasMounted = useSyncExternalStore(
    subscribeToHydration,
    getClientSnapshot,
    getServerSnapshot,
  );
  const { user, refreshToken, clearSession } = useAuthStore();
  const { getOrDefault } = useSetting();

  const siteName = getOrDefault(
    "site_name",
    getOrDefault("app_name", RESPONSE_MESSAGES.COMMON.DEFAULT_NAME)
  );

  // Zustand reads tokens from browser storage. Keep the first client render
  // identical to SSR, then show the authenticated navigation after hydration.
  const isLoggedIn = hasMounted && Boolean(user || refreshToken);

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
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold !text-pink-900"
          >
            <HeartPulse className="h-5 w-5 !text-pink-700" />
            {siteName}
          </Link>

          <nav className="flex items-center gap-2">
            {isLoggedIn ? (
              <>
                <Link
                  className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-medium !text-slate-700 hover:bg-pink-50 sm:flex"
                  href="/profile"
                >
                  <UserRound className="h-4 w-4" />
                  {user?.name ?? RESPONSE_MESSAGES.NAVIGATION.CART}
                </Link>

                <Link
                  className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-medium !text-slate-700 hover:bg-pink-50 sm:flex"
                  href="/uploads"
                >
                  <Upload className="h-4 w-4" />
                  {RESPONSE_MESSAGES.NAVIGATION.UPLOAD}
                </Link>

                <Button variant="light" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  {RESPONSE_MESSAGES.AUTH.LOGOUT}
                </Button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  aria-label={RESPONSE_MESSAGES.NAVIGATION.CART}
                  onClick={() => router.push("/login")}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-pink-700 transition hover:bg-pink-50"
                >
                  <ShoppingCart className="h-5 w-5" />
                </button>

                <Button variant="light" onClick={() => router.push("/login")}>
                  {RESPONSE_MESSAGES.AUTH.LOGIN}
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
