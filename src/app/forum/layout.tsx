import type {
  ReactNode,
} from "react";

import {
  AntdThemeProvider,
} from "@/providers/AntdThemeProvider";
import {
  AppShell,
} from "@/fe/components/layout/AppShell";
import { AuthProvider } from "@/hooks/useAuth";

export default function ForumLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <AntdThemeProvider mode="user">
      <AuthProvider>
        <AppShell>
          {children}
        </AppShell>
      </AuthProvider>
    </AntdThemeProvider>
  );
}
