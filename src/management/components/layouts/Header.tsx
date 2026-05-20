"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Menu, UserRound } from "lucide-react";
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
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-white px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" className="h-9 w-9 px-0 lg:hidden" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
        <div>
          <p className="text-sm font-medium text-slate-950">Admin Console</p>
          <p className="text-xs text-slate-500">Connected NestJS API</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link href="/management/profile" className="hidden items-center gap-2 text-sm text-slate-600 sm:flex">
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
