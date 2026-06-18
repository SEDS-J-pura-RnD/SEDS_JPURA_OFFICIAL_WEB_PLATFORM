import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import RolesClient from "./RolesClient";

export const metadata: Metadata = { title: "Roles | Admin" };

async function getAdminRolesData() {
  return await prisma.role.findMany({
    orderBy: { name: "asc" },
    include: {
      rolePermissions: { include: { permission: true } },
      userRoles: { select: { userId: true } },
    },
  });
}

export default async function AdminRolesPage() {
  const roles = await getAdminRolesData();

  return <RolesClient initialRoles={roles} />;
}
