"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, LogOut, Menu, Search, UserRound } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/management/components/ui/Button";

export function Header() {
  const router = useRouter();
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace("/management/login");
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur lg:px-8">
      <div className="flex items-center gap-3">
        <Button variant="ghost" className="h-9 w-9 px-0 lg:hidden" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
        <div>
          <p className="text-sm font-semibold text-slate-950">Admin Console</p>
          <p className="text-xs text-slate-500">Live backend connection</p>
        </div>
      </div>

      <div className="hidden w-full max-w-md items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 lg:flex">
        <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
        <input
          placeholder="Search users, roles, permissions"
          className="h-10 min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Notifications"
          className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-950"
        >
          <Bell className="h-4 w-4" aria-hidden="true" />
        </button>
        <Link
          href="/management/profile"
          className="hidden h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm transition hover:bg-slate-50 sm:flex"
        >
          <UserRound className="h-4 w-4" aria-hidden="true" />
          <span className="max-w-44 truncate">{currentUser?.email ?? "Unknown user"}</span>
        </Link>
        <Button type="button" variant="secondary" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </header>
  );
}
