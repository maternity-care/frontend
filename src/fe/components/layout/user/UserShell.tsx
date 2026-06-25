"use client";

import type { ReactNode } from "react";
import { Layout } from "antd";
import { AuthGuard } from "@/fe/components/layout/AuthGuard";
import { UserHeader } from "./UserHeader";

const { Content } = Layout;

export function UserShell({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <Layout className="min-h-screen !bg-pink-50">
        <UserHeader />

        <Content className="px-4 pb-8 pt-20 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </Content>
      </Layout>
    </AuthGuard>
  );
}