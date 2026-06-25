import type { ReactNode } from "react";
import { AntdThemeProvider } from "@/providers/AntdThemeProvider";
import { UserShell } from "@/fe/components/layout/user/UserShell";
import { AuthGuard } from "@/fe/components/layout/AuthGuard";

export default function UserLayout({ children }: { children: ReactNode }) {
  return (
    <AntdThemeProvider mode="user">
      <AuthGuard>
        <UserShell>{children}</UserShell>
      </AuthGuard>
    </AntdThemeProvider>
  );
}
