import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import UsersClient from "./UsersClient";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";

export const metadata: Metadata = { title: "Users | Admin" };

async function getAdminUsersData() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      userRoles: {
        include: {
          role: { select: { id: true, name: true, isActive: true } },
        },
      },
    },
  });

  const roles = await prisma.role.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  return { users, roles };
}

export default async function AdminUsersPage() {
  const { data: session } = await auth.getSession({ fetchOptions: { headers: await headers() } });
  if (!session) redirect("/auth/login?callbackUrl=/admin/users");

  const allowed = await hasPermission(session.user.id, PERMISSIONS.VIEW_USERS);
  if (!allowed) redirect("/admin");

  const { users, roles } = await getAdminUsersData();

  return <UsersClient initialUsers={users} roles={roles} />;
}
