import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import ContactClient from "./ContactClient";

export const metadata: Metadata = { title: "Inquiries | Admin" };

async function getAdminContactData() {
  return await prisma.contactInquiry.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export default async function AdminContactPage() {
  const inquiries = await getAdminContactData();

  return <ContactClient initialInquiries={inquiries} />;
}
