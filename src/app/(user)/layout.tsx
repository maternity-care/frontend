import type { ReactNode } from "react";
import { AntdThemeProvider } from "@/providers/AntdThemeProvider";

export default function UserLayout({ children }: { children: ReactNode }) {
  return (
    <AntdThemeProvider mode="user">
      <div className="flex min-h-screen items-center justify-center bg-pink-50">
        {children}
      </div>
    </AntdThemeProvider>
  );
}