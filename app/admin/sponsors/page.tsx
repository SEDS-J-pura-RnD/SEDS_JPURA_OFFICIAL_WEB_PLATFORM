import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import SponsorsClient from "./SponsorsClient";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";

export const metadata: Metadata = { title: "Sponsors | Admin" };

async function getAdminSponsorsData() {
  return await prisma.sponsor.findMany({
    orderBy: { tier: "asc" },
  });
}

export default async function AdminSponsorsPage() {
  const { data: session } = await auth.getSession({ fetchOptions: { headers: await headers() } });
  if (!session) redirect("/auth/login?callbackUrl=/admin/sponsors");

  const allowed = await hasPermission(session.user.id, PERMISSIONS.MANAGE_SPONSORS);
  if (!allowed) redirect("/admin");

  const sponsors = await getAdminSponsorsData();

  return <SponsorsClient initialSponsors={sponsors} />;
}
