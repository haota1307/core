/**
 * Script to update existing settings to mark them as public
 * Run with: npx tsx prisma/update-public-settings.ts
 */

import "dotenv/config";
import prisma from "@/lib/prisma";

const publicSettings: Record<string, string[]> = {
  general: [
    "siteName",
    "siteDescription",
    "siteLogo",
    "favicon",
    "contactEmail",
    "contactPhone",
    "address",
    "timezone",
    "dateFormat",
    "maintenanceMode",
  ],
  seo: [
    "defaultMetaTitle",
    "defaultMetaDescription",
    "defaultMetaKeywords",
    "googleAnalyticsId",
    "googleTagManagerId",
    "facebookPixelId",
    "enableSitemap",
  ],
  localization: [
    "defaultLocale",
    "availableLocales",
    "currencyCode",
    "currencySymbol",
    "currencyPosition",
    "thousandSeparator",
    "decimalSeparator",
  ],
};

async function updatePublicSettings() {
  console.log("Updating public settings...");

  for (const [group, keys] of Object.entries(publicSettings)) {
    const result = await prisma.setting.updateMany({
      where: {
        group,
        key: { in: keys },
      },
      data: {
        isPublic: true,
      },
    });
    console.log(
      `Updated ${result.count} settings in group "${group}" to public`
    );
  }

  console.log("Done!");
}

updatePublicSettings()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
