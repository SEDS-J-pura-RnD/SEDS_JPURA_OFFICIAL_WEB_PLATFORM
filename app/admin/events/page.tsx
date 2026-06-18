import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import EventsClient from "./EventsClient";

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
  const events = await getAdminEventsData();

  return <EventsClient initialEvents={events} />;
}
