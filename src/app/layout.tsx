import type { Metadata } from "next";
import { getPublicSettings } from "@/features/settings/settings.server";
import { getSettingString } from "@/features/settings/settings.types";
import { LocalStorageProvider } from "@/providers/LocalStorageProvider";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSettings();
  const title = getSettingString(settings, ["site_name", "siteName", "app_name", "appName"], "Maternity Care");
  const description = getSettingString(
    settings,
    ["site_description", "siteDescription", "description", "meta_description", "metaDescription"],
    "Frontend for Maternity Care System",
  );

  return {
    title,
    description,
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <LocalStorageProvider>{children}</LocalStorageProvider>
      </body>
    </html>
  );
}
