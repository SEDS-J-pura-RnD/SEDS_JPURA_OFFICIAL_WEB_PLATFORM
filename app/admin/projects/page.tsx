import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import ProjectsClient from "./ProjectsClient";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { hasAnyPermission, PERMISSIONS } from "@/lib/permissions";

export const metadata: Metadata = { title: "Projects | Admin" };

async function getAdminProjectsData() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      division: true,
      members: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      sponsors: { select: { id: true, name: true } },
      collaborators: { select: { id: true, name: true } },
    },
  });

  const divisions = await prisma.division.findMany({
    orderBy: { name: "asc" },
  });

  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  });

  const sponsors = await prisma.sponsor.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const collaborators = await prisma.collaborator.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return { projects, divisions, users, sponsors, collaborators };
}

export default async function AdminProjectsPage() {
  const { data: session } = await auth.getSession({ fetchOptions: { headers: await headers() } });
  if (!session) redirect("/auth/login?callbackUrl=/admin/projects");

  const allowed = await hasAnyPermission(session.user.id, [
    PERMISSIONS.CREATE_PROJECT,
    PERMISSIONS.EDIT_PROJECT,
    PERMISSIONS.DELETE_PROJECT,
    PERMISSIONS.ASSIGN_PROJECT_MEMBER,
    PERMISSIONS.VIEW_ALL_PROJECTS,
  ]);
  if (!allowed) redirect("/admin");

  const { projects, divisions, users, sponsors, collaborators } = await getAdminProjectsData();

  return (
    <ProjectsClient
      initialProjects={projects as any}
      divisions={divisions}
      users={users}
      sponsors={sponsors}
      collaborators={collaborators}
    />
  );
}
