import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import DivisionsClient from "./DivisionsClient";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";

export const metadata: Metadata = { title: "Divisions | Admin" };

async function getAdminDivisionsData() {
  return await prisma.division.findMany({
    orderBy: { name: "asc" },
  });
}

export default async function AdminDivisionsPage() {
  const { data: session } = await auth.getSession({ fetchOptions: { headers: await headers() } });
  if (!session) redirect("/auth/login?callbackUrl=/admin/divisions");

  const allowed = await hasPermission(session.user.id, PERMISSIONS.MANAGE_DIVISIONS);
  if (!allowed) redirect("/admin");

  const divisions = await getAdminDivisionsData();

  return <DivisionsClient initialDivisions={divisions} />;
}
