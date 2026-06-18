import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import UsersClient from "./UsersClient";

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
  const { users, roles } = await getAdminUsersData();

  return <UsersClient initialUsers={users} roles={roles} />;
}
