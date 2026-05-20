import type { MetadataRoute } from "next";
import { getPublicSettings, getSiteUrl } from "@/features/settings/settings.server";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getPublicSettings();
  const baseUrl = getSiteUrl(settings);

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/management", "/profile", "/uploads"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
