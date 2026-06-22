"use client";

import { App, ConfigProvider } from "antd";
import type { ReactNode } from "react";

type ThemeMode = "user" | "management";

const themes = {
  user: {
    primary: "#ec4899",
    primaryHover: "#db2777",
    primaryActive: "#be185d",
    bgLayout: "#fdf2f8",
  },
  management: {
    primary: "#0f766e",
    primaryHover: "#0d9488",
    primaryActive: "#115e59",
    bgLayout: "#f0fdfa",
  },
};

export function AntdThemeProvider({
  children,
  mode = "user",
}: {
  children: ReactNode;
  mode?: ThemeMode;
}) {
  const theme = themes[mode];

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: theme.primary,
          colorLink: theme.primary,
          colorInfo: theme.primary,
          colorBgLayout: theme.bgLayout,
          borderRadius: 10,
        },
        components: {
          Button: {
            colorPrimary: theme.primary,
            colorPrimaryHover: theme.primaryHover,
            colorPrimaryActive: theme.primaryActive,
            borderRadius: 10,
          },
          Checkbox: {
            colorPrimary: theme.primary,
            colorPrimaryHover: theme.primaryHover,
          },
          Input: {
            activeBorderColor: theme.primary,
            hoverBorderColor: theme.primaryHover,
            activeShadow:
              mode === "user"
                ? "0 0 0 2px rgba(236, 72, 153, 0.12)"
                : "0 0 0 2px rgba(15, 118, 110, 0.12)",
          },
          Card: {
            borderRadiusLG: 14,
          },
        },
      }}
    >
      <App>{children}</App>
    </ConfigProvider>
  );
}