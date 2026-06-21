import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import EventsClient from "./EventsClient";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { hasAnyPermission, PERMISSIONS } from "@/lib/permissions";

export const metadata: Metadata = { title: "Events | Admin" };

async function getAdminEventsData() {
  return await prisma.event.findMany({
    orderBy: { startDate: "desc" },
    include: {
      registrations: true,
    },
  });
}

export default async function AdminEventsPage() {
  const { data: session } = await auth.getSession({ fetchOptions: { headers: await headers() } });
  if (!session) redirect("/auth/login?callbackUrl=/admin/events");

  const allowed = await hasAnyPermission(session.user.id, [
    PERMISSIONS.CREATE_EVENT,
    PERMISSIONS.EDIT_EVENT,
    PERMISSIONS.DELETE_EVENT,
    PERMISSIONS.MANAGE_EVENTS,
  ]);
  if (!allowed) redirect("/admin");

  const events = await getAdminEventsData();

  return <EventsClient initialEvents={events} />;
}
