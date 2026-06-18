import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import CertificatesClient from "./CertificatesClient";

export const metadata: Metadata = { title: "Certificates | Admin" };

async function getAdminCertificatesData() {
  return await prisma.certificate.findMany({
    orderBy: { issueDate: "desc" },
  });
}

export default async function AdminCertificatesPage() {
  const certs = await getAdminCertificatesData();

  return <CertificatesClient initialCertificates={certs} />;
}
