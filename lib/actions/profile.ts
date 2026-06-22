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
