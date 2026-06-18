import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import SponsorsClient from "./SponsorsClient";

export const metadata: Metadata = { title: "Sponsors | Admin" };

async function getAdminSponsorsData() {
  return await prisma.sponsor.findMany({
    orderBy: { tier: "asc" },
  });
}

export default async function AdminSponsorsPage() {
  const sponsors = await getAdminSponsorsData();

  return <SponsorsClient initialSponsors={sponsors} />;
}
