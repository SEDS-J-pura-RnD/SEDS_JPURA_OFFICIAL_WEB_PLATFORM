import type { Metadata } from "next";
import PermissionsClient from "./PermissionsClient";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";

export const metadata: Metadata = { title: "Permissions | Admin" };

export default async function AdminPermissionsPage() {
  const { data: session } = await auth.getSession({ fetchOptions: { headers: await headers() } });
  if (!session) redirect("/auth/login?callbackUrl=/admin/permissions");

  const allowed = await hasPermission(session.user.id, PERMISSIONS.MANAGE_PERMISSIONS);
  if (!allowed) redirect("/admin");

  return <PermissionsClient />;
}
