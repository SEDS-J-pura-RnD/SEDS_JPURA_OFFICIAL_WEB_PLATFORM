"use server";

import { prisma } from "../db";
import { eventRegistrationSchema } from "../validations";
import { getClientIP, logAudit } from "../audit";
import { revalidatePath } from "next/cache";

export async function registerForEventAction(
  eventId: string,
  data: { name: string; email: string; phone?: string }
) {
  try {
    const ip = await getClientIP();

    // 1. Validate inputs
    const parsed = eventRegistrationSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: "Invalid registration details. Please check the inputs." };
    }

    // 2. Fetch event details and check if it exists, is published, and is upcoming
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: { registrations: true },
        },
      },
    });

    if (!event) {
      return { success: false, error: "The requested event could not be found." };
    }

    if (!event.isPublished) {
      return { success: false, error: "Registration is not open for this event." };
    }

    const now = new Date();
    if (new Date(event.startDate) < now) {
      return { success: false, error: "This event has already occurred. Registration is closed." };
    }

    // 3. Verify event capacity constraints
    if (event.maxCapacity !== null && event._count.registrations >= event.maxCapacity) {
      return { success: false, error: "This event has reached maximum capacity." };
    }

    // 4. Verify duplicate registration check
    const existingRegistration = await prisma.eventRegistration.findUnique({
      where: {
        eventId_email: {
          eventId,
          email: parsed.data.email.toLowerCase(),
        },
      },
    });

    if (existingRegistration) {
      return { success: false, error: "This email address is already registered for this event." };
    }

    // 5. Create new event registration record
    const registration = await prisma.eventRegistration.create({
      data: {
        eventId,
        name: parsed.data.name,
        email: parsed.data.email.toLowerCase(),
        phone: parsed.data.phone || null,
      },
    });

    // 6. Log dynamic audit event
    await logAudit({
      action: "EVENT_REGISTRATION_CREATED",
      entity: "EventRegistration",
      entityId: registration.id,
      newState: {
        eventId,
        eventTitle: event.title,
        name: registration.name,
        email: registration.email,
      },
      ipAddress: ip,
    });

    // Revalidate routes
    revalidatePath(`/events/${eventId}`);
    revalidatePath("/events");

    return { success: true, registrationId: registration.id };
  } catch (err) {
    console.error("[registerForEventAction] Unexpected error:", err);
    return { success: false, error: "An unexpected database error occurred. Please try again." };
  }
}
