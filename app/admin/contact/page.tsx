import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import ContactClient from "./ContactClient";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";

export const metadata: Metadata = { title: "Inquiries | Admin" };

async function getAdminContactData() {
  return await prisma.contactInquiry.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export default async function AdminContactPage() {
  const { data: session } = await auth.getSession({ fetchOptions: { headers: await headers() } });
  if (!session) redirect("/auth/login?callbackUrl=/admin/contact");

  const allowed = await hasPermission(session.user.id, PERMISSIONS.MANAGE_CONTACT);
  if (!allowed) redirect("/admin");

  const inquiries = await getAdminContactData();

  return <ContactClient initialInquiries={inquiries} />;
}
