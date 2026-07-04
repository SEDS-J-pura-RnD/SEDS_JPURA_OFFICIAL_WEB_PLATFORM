"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

/**
 * Checks if the current user has the privilege to be displayed on the /team page.
 */
export async function checkTeamPrivilegeAction(): Promise<boolean> {
  const { data: session } = await auth.getSession({
    fetchOptions: { headers: await headers() },
  });
  if (!session) return false;

  const userRoles = await prisma.userRole.findMany({
    where: {
      userId: session.user.id,
      role: {
        isActive: true,
        showOnTeam: true,
      },
    },
  });

  return userRoles.length > 0;
}

/**
 * Updates the user's avatar image URL after verifying team display privilege.
 */
export async function updateProfileImageAction(imageUrl: string) {
  const { data: session } = await auth.getSession({
    fetchOptions: { headers: await headers() },
  });
  if (!session) {
    throw new Error("Unauthorized");
  }

  const isPrivileged = await checkTeamPrivilegeAction();
  if (!isPrivileged) {
    throw new Error("Access Denied: Only team members displayed on the team page can set custom profile images.");
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { image: imageUrl || null },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  revalidatePath("/team");

  return { success: true };
}

/**
 * Fetches the currently logged-in member's profile details.
 */
export async function getMemberProfileAction() {
  const { data: session } = await auth.getSession({
    fetchOptions: { headers: await headers() },
  });
  if (!session) {
    throw new Error("Unauthorized");
  }

  const profile = await prisma.memberProfile.findUnique({
    where: { userId: session.user.id },
  });

  return profile;
}

/**
 * Updates or creates the currently logged-in member's profile details.
 */
export async function updateMemberProfileAction(data: {
  bio: string;
  interests: string[];
  awards: string;
  linkedin: string;
  github: string;
  website: string;
}) {
  const { data: session } = await auth.getSession({
    fetchOptions: { headers: await headers() },
  });
  if (!session) {
    throw new Error("Unauthorized");
  }

  // Ensure they have team privileges
  const isPrivileged = await checkTeamPrivilegeAction();
  if (!isPrivileged) {
    throw new Error("Access Denied: Only active team members can modify profile biographies.");
  }

  const profile = await prisma.memberProfile.upsert({
    where: { userId: session.user.id },
    update: {
      bio: data.bio || null,
      interests: data.interests || [],
      awards: data.awards || null,
      linkedin: data.linkedin || null,
      github: data.github || null,
      website: data.website || null,
    },
    create: {
      userId: session.user.id,
      bio: data.bio || null,
      interests: data.interests || [],
      awards: data.awards || null,
      linkedin: data.linkedin || null,
      github: data.github || null,
      website: data.website || null,
    },
  });

  revalidatePath("/dashboard/profile");
  revalidatePath(`/members/${session.user.id}`);
  revalidatePath("/team");

  return { success: true, profile };
}

/**
 * Fetches public details of a selected member by user ID.
 */
export async function getPublicMemberProfileAction(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      userRoles: {
        where: {
          role: {
            isActive: true,
            showOnTeam: true,
          },
        },
        include: {
          role: { select: { name: true, teamTitle: true } },
        },
        orderBy: { assignedAt: "asc" },
      },
      memberProfile: true,
      projectMembers: {
        include: {
          project: {
            select: { id: true, title: true, imageUrl: true, status: true },
          },
        },
      },
    },
  });

  return user;
}
