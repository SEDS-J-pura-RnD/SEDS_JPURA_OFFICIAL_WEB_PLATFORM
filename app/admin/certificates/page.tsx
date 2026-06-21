import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import CertificatesClient from "./CertificatesClient";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { hasAnyPermission, PERMISSIONS } from "@/lib/permissions";

export const metadata: Metadata = { title: "Certificates | Admin" };

async function getAdminCertificatesData() {
  return await prisma.certificate.findMany({
    orderBy: { issueDate: "desc" },
  });
}

export default async function AdminCertificatesPage() {
  const { data: session } = await auth.getSession({ fetchOptions: { headers: await headers() } });
  if (!session) redirect("/auth/login?callbackUrl=/admin/certificates");

  const allowed = await hasAnyPermission(session.user.id, [
    PERMISSIONS.ISSUE_CERTIFICATE,
    PERMISSIONS.REVOKE_CERTIFICATE,
  ]);
  if (!allowed) redirect("/admin");

  const certs = await getAdminCertificatesData();

  return <CertificatesClient initialCertificates={certs} />;
}
