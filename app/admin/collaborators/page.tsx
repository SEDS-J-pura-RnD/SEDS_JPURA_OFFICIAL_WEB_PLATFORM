import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import CollaboratorsClient from "./CollaboratorsClient";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";

export const metadata: Metadata = { title: "Collaborators | Admin" };

async function getAdminCollaboratorsData() {
  return await prisma.collaborator.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export default async function AdminCollaboratorsPage() {
  const { data: session } = await auth.getSession({ fetchOptions: { headers: await headers() } });
  if (!session) redirect("/auth/login?callbackUrl=/admin/collaborators");

  const allowed = await hasPermission(session.user.id, PERMISSIONS.MANAGE_SPONSORS);
  if (!allowed) redirect("/admin");

  const collaborators = await getAdminCollaboratorsData();

  return <CollaboratorsClient initialCollaborators={collaborators} />;
}
