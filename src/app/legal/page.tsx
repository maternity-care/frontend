"use client";

import { AppShell } from "@/fe/components/layout/AppShell";
import { SiteFooter } from "@/fe/components/layout/SiteFooter";
import LegalContent from "@/fe/components/legal/LegalContent";
import LegalSidebar from "@/fe/components/legal/LegalSidebar";
import { useState } from "react";

export type LegalTab =
  | "general"
  | "privacy"
  | "user-protection"
  | "disclaimer"
  | "complaint"
  | "patient-rights";

export default function LegalPage() {
  const [activeTab, setActiveTab] = useState<LegalTab>("general");

  return (
    <>
      <AppShell>
        <div className="min-h-screen">
          <div className="max-w-6xl mx-auto px-5 lg:px-10 pt-5 pb-24">
            <div className="flex">
              <LegalSidebar activeTab={activeTab} onChange={setActiveTab} />
              <main className="flex-1 min-w-0 pl-20 lg:pl-16 xl:pl-20">
                <LegalContent activeTab={activeTab} />
              </main>
            </div>
          </div>
        </div>
      </AppShell>
      <SiteFooter />
    </>
  );
}
