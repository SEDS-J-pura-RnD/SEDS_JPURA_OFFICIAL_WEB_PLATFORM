import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import CollaboratorsClient from "./CollaboratorsClient";

export const metadata: Metadata = { title: "Collaborators | Admin" };

async function getAdminCollaboratorsData() {
  return await prisma.collaborator.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export default async function AdminCollaboratorsPage() {
  const collaborators = await getAdminCollaboratorsData();

  return <CollaboratorsClient initialCollaborators={collaborators} />;
}
