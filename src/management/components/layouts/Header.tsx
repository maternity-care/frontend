"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  ChevronDown,
  LogOut,
  Menu,
  Settings,
  UserRound,
} from "lucide-react";
import { Dropdown, type MenuProps } from "antd";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/features/auth/auth.store";
import { Button } from "@/management/components/ui/Button";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";

const sectionLabels: Record<string, string> = {
  dashboard: "Tổng quan",
  users: "Người dùng",
  staffs: "Nhân viên",
  facilities: "Cơ sở",
  rooms: "Phòng khám",
  roles: "Vai trò",
  permissions: "Quyền hạn",
  jobs: "Công việc",
  uploads: "Tệp tải lên",
  profile: "Hồ sơ cá nhân",
  "appointment-disruptions": "Lịch hẹn bị ảnh hưởng",
};

function getInitials(name?: string) {
  if (!name) return "MC";

  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout } = useAuth();
  const { activeFacilityId, setActiveFacility } = useAuthStore();
  const section = pathname.split("/").filter(Boolean)[1] ?? "dashboard";
  const isSuperAdmin = currentUser?.roles?.some(
    (role) => role.name === "super_admin",
  );
  const facilities = currentUser?.facilities ?? [];
  const activeFacility =
    facilities.find(
      (facility) => String(facility.id) === String(activeFacilityId),
    ) ?? facilities.find((facility) => facility.status === "active");

  const handleLogout = async () => {
    await logout();
    router.replace("/management/login");
  };

  const profileMenu: MenuProps = {
    items: [
      {
        key: "profile",
        icon: <UserRound className="h-4 w-4" />,
        label: "Hồ sơ cá nhân",
      },
      {
        key: "settings",
        icon: <Settings className="h-4 w-4" />,
        label: "Đổi mật khẩu",
      },
      { type: "divider" },
      {
        key: "logout",
        danger: true,
        icon: <LogOut className="h-4 w-4" />,
        label: "Đăng xuất",
      },
    ],
    onClick: ({ key }) => {
      if (key === "logout") {
        void handleLogout();
        return;
      }
      router.push("/management/profile");
    },
  };

  return (
    <header className="sticky top-0 z-20 h-16 shrink-0 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md lg:px-8">
      <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="ghost"
            className="h-9 w-9 shrink-0 px-0 lg:hidden"
            aria-label="Mở menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex min-w-0 items-center gap-2 text-sm">
            <span className="hidden font-medium text-slate-500 sm:inline">
              Quản lý
            </span>
            <span className="hidden text-slate-300 sm:inline">/</span>
            <span className="truncate font-semibold text-slate-800">
              {sectionLabels[section] ?? "Dashboard"}
            </span>
          </div>
        </div>

        <div className="flex min-w-0 items-center gap-2">
          {!isSuperAdmin && facilities.length > 0 ? (
            <label className="group relative hidden h-10 min-w-0 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 transition hover:border-slate-300 hover:bg-white md:flex">
              <Building2
                className="h-4 w-4 shrink-0 text-cyan-700"
                aria-hidden="true"
              />
              <select
                value={activeFacility?.id ?? ""}
                onChange={(event) => setActiveFacility(event.target.value)}
                className="max-w-52 appearance-none bg-transparent pr-5 text-sm font-medium text-slate-700 outline-none"
                aria-label="Cơ sở đang làm việc"
              >
                {facilities.map((facility) => (
                  <option
                    key={facility.id}
                    value={facility.id}
                    disabled={facility.status !== "active"}
                  >
                    {facility.name}
                    {facility.status !== "active" ? " (Tạm ngưng)" : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 h-3.5 w-3.5 text-slate-400" />
            </label>
          ) : null}

          <NotificationCenter />

          <div className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" />

          <Dropdown menu={profileMenu} trigger={["click"]} placement="bottomRight">
            <button
              type="button"
              className="group flex h-11 min-w-0 items-center gap-2 rounded-md px-1.5 text-left transition hover:bg-slate-100"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-900 text-[11px] font-bold text-white">
                {getInitials(currentUser?.name)}
              </span>
              <span className="hidden min-w-0 sm:block">
                <span className="block max-w-44 truncate text-sm font-semibold leading-4 text-slate-800">
                  {currentUser?.name ?? "Tài khoản"}
                </span>
                <span className="mt-0.5 block max-w-44 truncate text-[11px] leading-3 text-slate-500">
                  {currentUser?.email}
                </span>
              </span>
              <ChevronDown className="hidden h-3.5 w-3.5 shrink-0 text-slate-400 sm:block" />
            </button>
          </Dropdown>
        </div>
      </div>
    </header>
  );
}
