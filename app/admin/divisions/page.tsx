import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import DivisionsClient from "./DivisionsClient";

export const metadata: Metadata = { title: "Divisions | Admin" };

async function getAdminDivisionsData() {
  return await prisma.division.findMany({
    orderBy: { name: "asc" },
  });
}

export default async function AdminDivisionsPage() {
  const divisions = await getAdminDivisionsData();

  return <DivisionsClient initialDivisions={divisions} />;
}
