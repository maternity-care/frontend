import { AntdThemeProvider } from "@/providers/AntdThemeProvider";

export default function ManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AntdThemeProvider mode="management">{children}</AntdThemeProvider>;
}
