import { AntdThemeProvider } from "@/providers/AntdThemeProvider";
import { ReactNode } from "react";
export default function LegalLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <AntdThemeProvider mode="user">
      {children}
    </AntdThemeProvider>
  );
}