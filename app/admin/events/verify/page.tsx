import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { hasAnyPermission, PERMISSIONS } from "@/lib/permissions";
import TicketScannerClient from "./TicketScannerClient";

export const metadata: Metadata = {
  title: "Event Ticket Scanner & Verification | Admin",
  description: "Scan QR codes and verify attendee tickets for SEDS J'pura events.",
};

async function getScannerEvents() {
  const events = await prisma.event.findMany({
    orderBy: { startDate: "desc" },
    select: {
      id: true,
      title: true,
      location: true,
      startDate: true,
      endDate: true,
      imageUrl: true,
      maxCapacity: true,
      _count: {
        select: {
          registrations: true,
        },
      },
      registrations: {
        where: { checkedIn: true },
        select: { id: true },
      },
    },
  });

  return events.map((e) => ({
    id: e.id,
    title: e.title,
    location: e.location,
    startDate: e.startDate,
    endDate: e.endDate,
    imageUrl: e.imageUrl,
    maxCapacity: e.maxCapacity,
    totalRegistrations: e._count.registrations,
    checkedInCount: e.registrations.length,
  }));
}

export default async function AdminEventTicketVerifyPage() {
  const { data: session } = await auth.getSession({
    fetchOptions: { headers: await headers() },
  });

  if (!session) {
    redirect("/auth/login?callbackUrl=/admin/events/verify");
  }

  const allowed = await hasAnyPermission(session.user.id, [
    PERMISSIONS.EDIT_EVENT,
    PERMISSIONS.MANAGE_EVENTS,
    PERMISSIONS.VIEW_ADMIN_DASHBOARD,
  ]);

  if (!allowed) {
    redirect("/admin");
  }

  const events = await getScannerEvents();

  return <TicketScannerClient events={events} />;
}
