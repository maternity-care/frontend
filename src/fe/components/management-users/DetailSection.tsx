"use client";

import type { ReactNode } from "react";
import { Typography } from "antd";

const { Title } = Typography;

export function DetailSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-pink-500">{icon}</span>
        <Title level={5} className="!mb-0 !text-slate-950">
          {title}
        </Title>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {children}
      </div>
    </section>
  );
}