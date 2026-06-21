import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import RolesClient from "./RolesClient";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";

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
  const { data: session } = await auth.getSession({ fetchOptions: { headers: await headers() } });
  if (!session) redirect("/auth/login?callbackUrl=/admin/roles");

  const allowed = await hasPermission(session.user.id, PERMISSIONS.MANAGE_ROLES);
  if (!allowed) redirect("/admin");

  const roles = await getAdminRolesData();

  return <RolesClient initialRoles={roles} />;
}
