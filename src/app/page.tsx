"use client";

import Link from "next/link";
import { CalendarDays, FileUp, HeartPulse, UserRound } from "lucide-react";
import { AppShell } from "@/fe/components/layout/AppShell";
import { Button } from "@/fe/components/ui/Button";
import { Panel } from "@/fe/components/ui/Panel";
import useSetting from "@/hooks/useSetting";

const items = [
  { title: "Hồ sơ cá nhân", description: "Xem và cập nhật thông tin tài khoản.", icon: UserRound, href: "/profile" },
  { title: "Tài liệu sức khỏe", description: "Tạo presigned upload URL cho file của bạn.", icon: FileUp, href: "/uploads" },
  { title: "Lịch chăm sóc", description: "Không gian UI cho các tính năng user sau này.", icon: CalendarDays, href: "/profile" },
];

export default function HomePage() {
  const { getOrDefault } = useSetting();
  const badge = getOrDefault("home_badge", "User Frontend");
  const title = getOrDefault(
    "hero_title",
    "Chăm sóc thai kỳ và hồ sơ sức khỏe trong một giao diện riêng.",
  );
  const description = getOrDefault(
    "hero_description",
    "User UI và management UI nằm chung một Next.js project, nhưng code và style được tách folder riêng.",
  );
  const panelTitle = getOrDefault("home_panel_title", "Thông tin hệ thống");
  const panelDescription = getOrDefault(
    "home_panel_description",
    "Dữ liệu public settings được lấy từ backend qua GET /settings và có fallback khi backend chưa cấu hình.",
  );

  return (
    <AppShell>
      <section className="grid items-center gap-8 py-8 lg:grid-cols-[1fr_420px]">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-teal-800 shadow-sm ring-1 ring-teal-100">
            <HeartPulse className="h-4 w-4" />
            {badge}
          </div>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-normal text-slate-950 md:text-5xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">{description}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/login">
              <Button>Login</Button>
            </Link>
            <Link href="/management/login">
              <Button variant="light">Management</Button>
            </Link>
          </div>
        </div>
        <Panel>
          <p className="text-sm font-semibold uppercase text-teal-700">{panelTitle}</p>
          <p className="mt-4 text-sm leading-6 text-slate-600">{panelDescription}</p>
          <div className="mt-5 grid gap-3 text-sm text-slate-700">
            <Link className="rounded-xl bg-teal-50 px-4 py-3 transition hover:bg-teal-100" href="/profile">
              Hồ sơ cá nhân
            </Link>
            <Link className="rounded-xl bg-teal-50 px-4 py-3 transition hover:bg-teal-100" href="/uploads">
              Upload tài liệu
            </Link>
            <Link className="rounded-xl bg-teal-50 px-4 py-3 transition hover:bg-teal-100" href="/management/login">
              Management console
            </Link>
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.title} href={item.href}>
              <Panel className="h-full transition hover:-translate-y-0.5 hover:shadow-md">
                <Icon className="h-6 w-6 text-teal-700" />
                <h2 className="mt-4 text-lg font-semibold text-slate-950">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
              </Panel>
            </Link>
          );
        })}
      </section>
    </AppShell>
  );
}
