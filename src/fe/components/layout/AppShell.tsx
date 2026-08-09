"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useSyncExternalStore, useEffect, useState } from "react";
import { HeartPulse, LogOut, Home } from "lucide-react";

import { logout as logoutApi } from "@/features/auth/auth.api";
import { useAuthStore } from "@/features/auth/auth.store";
import { Button } from "@/fe/components/ui/Button";
import { CartButton } from "@/fe/components/layout/CartButton";
import useSetting from "@/hooks/useSetting";
import { RESPONSE_MESSAGES } from "@/constants/response-message.constant";

const subscribeToHydration = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export type HomeTab =
  | "gioi-thieu"
  | "dich-vu"
  | "bac-si"
  | "lien-he";

const navItems: { label: string; tab: HomeTab }[] = [
  { label: "Giới thiệu", tab: "gioi-thieu" },
  { label: "Dịch vụ", tab: "dich-vu" },
  { label: "Bác sĩ", tab: "bac-si" },
  { label: "Liên hệ", tab: "lien-he" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const hasMounted = useSyncExternalStore(
    subscribeToHydration,
    getClientSnapshot,
    getServerSnapshot,
  );
  const { user, refreshToken, clearSession } = useAuthStore();
  const { getOrDefault } = useSetting();

  const siteName = getOrDefault(
    "site_name",
    getOrDefault("app_name", RESPONSE_MESSAGES.COMMON.DEFAULT_NAME),
  );

  const isLoggedIn = hasMounted && Boolean(user || refreshToken);

  const [activeTab, setActiveTab] = useState<HomeTab>("gioi-thieu");

  useEffect(() => {
    if (pathname !== "/") return;

    const syncFromHash = () => {
      const hash = window.location.hash.replace("#", "") as HomeTab;
      const valid = navItems.some((item) => item.tab === hash);
      setActiveTab(valid ? hash : "gioi-thieu");
    };

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, [pathname]);

  const handleNavClick = (tab: HomeTab) => {
    if (pathname !== "/") {
      router.push(`/#${tab}`);
      return;
    }
    window.location.hash = tab;
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
            href="/#gioi-thieu"
            onClick={() => handleNavClick("gioi-thieu")}
            className="flex items-center gap-2 font-semibold !text-pink-900"
          >
            <HeartPulse className="h-5 w-5 !text-pink-700" />
            {siteName}
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2">
            {navItems.map((item) => (
              <button
                key={item.tab}
                onClick={() => handleNavClick(item.tab)}
                className={[
                  "hidden rounded-full px-3 py-2 text-sm font-medium transition sm:block",
                  activeTab === item.tab && pathname === "/"
                    ? "bg-pink-100 text-pink-700"
                    : "text-slate-700 hover:bg-pink-50",
                ].join(" ")}
              >
                {item.label}
              </button>
            ))}

            {/* Giỏ hàng – luôn hiện */}
            <CartButton />

            {isLoggedIn ? (
              <>
                {/* Nút về trang chủ sau login */}
                <Button
                  variant="light"
                  onClick={() => router.push("/schedule")}
                  className="!gap-1.5"
                >
                  <Home className="h-4 w-4" />
                  <span className="hidden sm:inline">Trang chủ</span>
                </Button>

                {/* <Button variant="light" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  {RESPONSE_MESSAGES.AUTH.LOGOUT}
                </Button> */}
              </>
            ) : (
              <Button variant="light" onClick={() => router.push("/login")}>
                {RESPONSE_MESSAGES.AUTH.LOGIN} / Đăng ký
              </Button>
            )}
          </nav>
        </div>
      </header>

      <main
        className="mx-auto max-w-6xl px-4 py-8"
        data-active-tab={activeTab}
      >
        {children}
      </main>
    </div>
  );
}