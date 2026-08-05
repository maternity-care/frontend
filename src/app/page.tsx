"use client";

import { useEffect, useState } from "react";
import { AppShell, type HomeTab } from "@/fe/components/layout/AppShell";
import { SiteFooter } from "@/fe/components/layout/SiteFooter";
import { IntroTab } from "@/fe/components/home/IntroTab";
import { ServicesTab } from "@/fe/components/home/ServicesTab";
import { PackagesTab } from "@/fe/components/home/PackagesTab";
import { DoctorsTab } from "@/fe/components/home/DoctorsTab";
import { ContactTab } from "@/fe/components/home/ContactTab";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<HomeTab>("gioi-thieu");

  useEffect(() => {
    const sync = () => {
      const hash = window.location.hash.replace("#", "") as HomeTab;
      const validTabs: HomeTab[] = [
        "gioi-thieu",
        "dich-vu",
        "bac-si",
        "lien-he",
      ];
      setActiveTab(validTabs.includes(hash) ? hash : "gioi-thieu");
    };

    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const renderTab = () => {
    switch (activeTab) {
      case "dich-vu":
        return <PackagesTab />;
      case "bac-si":
        return <DoctorsTab />;
      case "lien-he":
        return <ContactTab />;
      case "gioi-thieu":
      default:
        return <IntroTab />;
    }
  };

  return (
    <>
      <AppShell>
        <div className="min-h-[60vh]">{renderTab()}</div>
      </AppShell>
      <SiteFooter />
    </>
  );
}