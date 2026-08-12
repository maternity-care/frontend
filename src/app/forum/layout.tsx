import type {
  ReactNode,
} from "react";

import {
  AntdThemeProvider,
} from "@/providers/AntdThemeProvider";
import {
  AppShell,
} from "@/fe/components/layout/AppShell";

export default function ForumLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <AntdThemeProvider mode="user">
      <AppShell>
        {children}
      </AppShell>
    </AntdThemeProvider>
  );
}