import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import ProjectsClient from "./ProjectsClient";

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
    },
  });

  const divisions = await prisma.division.findMany({
    orderBy: { name: "asc" },
  });

  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  });

  return { projects, divisions, users };
}

export default async function AdminProjectsPage() {
  const { projects, divisions, users } = await getAdminProjectsData();

  return (
    <ProjectsClient
      initialProjects={projects}
      divisions={divisions}
      users={users}
    />
  );
}
