import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getUserPermissions, PERMISSIONS } from "@/lib/permissions";
import { getResolvedHomePageStats } from "@/lib/site-settings";
import SiteSettingsClient from "./SiteSettingsClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home Page Metrics | SEDS J'pura Admin",
  description: "Configure the live metrics and custom statistics displayed on the home page",
};

export default async function SiteSettingsPage() {
  const { data: session } = await auth.getSession({ fetchOptions: { headers: await headers() } });
  if (!session) redirect("/auth/login?callbackUrl=/admin/site-settings");

  const permissions = await getUserPermissions(session.user.id);
  if (!permissions.includes(PERMISSIONS.VIEW_ADMIN_DASHBOARD)) {
    redirect("/admin");
  }

  const initialData = await getResolvedHomePageStats();

  return <SiteSettingsClient initialData={initialData} />;
}
