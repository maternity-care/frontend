"use client";

import type { MenuProps } from "antd";
import { Avatar, Button, Dropdown, Layout, Typography, message } from "antd";
import {
  CalendarDays,
  ChevronDown,
  HeartPulse,
  LogOut,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { logout as logoutApi } from "@/features/auth/auth.api";
import { useAuthStore } from "@/features/auth/auth.store";
import useAuth from "@/hooks/useAuth";
import { RESPONSE_MESSAGES } from "@/constants/response-message.constant";

const { Header } = Layout;
const { Text } = Typography;

function getInitials(name?: string | null) {
  if (!name) return "U";

  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function UserHeader() {
  const router = useRouter();
  const { currentUser } = useAuth();

  const refreshToken = useAuthStore((state) => state.refreshToken);
  const clearSession = useAuthStore((state) => state.clearSession);

  const [messageApi, contextHolder] = message.useMessage();

  const handleLogout = async () => {
    try {
      let logoutMessage = "Logged out successfully";

      if (refreshToken) {
        const response = await logoutApi(refreshToken);

        logoutMessage =
          typeof response === "string"
            ? response
            : response.message || "Logged out successfully";
      }

      messageApi.success({
        content: logoutMessage,
        duration: 2,
      });

      setTimeout(() => {
        clearSession();
        router.replace("/login");
      }, 700);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Đăng xuất thất bại";

      messageApi.error({
        content: errorMessage,
        duration: 3,
      });
    }
  };

  const handleMenuClick: MenuProps["onClick"] = async ({ key }) => {
    if (key === "profile") {
      router.push("/profile");
      return;
    }

    if (key === "schedule") {
      router.push("/schedule");
      return;
    }

    if (key === "logout") {
      await handleLogout();
    }
  };

  const menuItems: MenuProps["items"] = [
    {
      key: "profile",
      icon: <UserRound className="h-4 w-4" />,
      label: RESPONSE_MESSAGES.NAVIGATION.VIEW_PROFILE,
    },
    {
      key: "schedule",
      icon: <CalendarDays className="h-4 w-4" />,
      label: RESPONSE_MESSAGES.NAVIGATION.SCHEDULE,
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      danger: true,
      icon: <LogOut className="h-4 w-4" />,
      label: RESPONSE_MESSAGES.AUTH.LOGOUT,
    },
  ];

  return (
    <>
      {contextHolder}

      <Header className="fixed left-0 top-0 z-50 flex h-16 w-full items-center justify-between border-b border-pink-100 !bg-white/95 !px-4 shadow-sm backdrop-blur sm:!px-6 lg:!px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-100 text-pink-600">
            <HeartPulse className="h-5 w-5" />
          </div>

          <div className="leading-tight">
            <div className="text-base font-semibold text-slate-950">
              {RESPONSE_MESSAGES.COMMON.DEFAULT_NAME}
            </div>
            <div className="text-xs text-slate-500">{RESPONSE_MESSAGES.COMMON.PREGNANT}</div>
          </div>
        </Link>

        <Dropdown
          menu={{
            items: menuItems,
            onClick: handleMenuClick,
          }}
          placement="bottomRight"
          trigger={["click"]}
        >
          <Button
            type="text"
            className="!flex !h-11 !items-center !gap-2 !rounded-full !px-2"
          >
            <Avatar className="!bg-pink-500">
              {getInitials(currentUser?.name)}
            </Avatar>

            <div className="hidden text-left sm:block">
              <Text strong className="block max-w-36 truncate">
                {currentUser?.name || RESPONSE_MESSAGES.COMMON.PREGNANT}
              </Text>
              <Text type="secondary" className="block max-w-36 truncate text-xs">
                {currentUser?.email || ""}
              </Text>
            </div>

            <ChevronDown className="h-4 w-4 text-slate-500" />
          </Button>
        </Dropdown>
      </Header>
    </>
  );
}