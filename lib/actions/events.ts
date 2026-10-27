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
    revalidatePath("/admin/events");

    return { success: true, registrationId: registration.id };
  } catch (err) {
    console.error("[registerForEventAction] Unexpected error:", err);
    return { success: false, error: "An unexpected database error occurred. Please try again." };
  }
}

import { extractTicketIdFromPayload } from "../ticket-parser";

// ─────────────────────────────────────────────
// VERIFY EVENT TICKET ACTION
// Checks if ticket exists, is for correct event, and check-in status
// ─────────────────────────────────────────────
import { auth } from "../auth";
import { headers } from "next/headers";
import { hasAnyPermission, PERMISSIONS } from "../permissions";

export type TicketVerificationStatus =
  | "VALID"
  | "ALREADY_CHECKED_IN"
  | "EVENT_MISMATCH"
  | "INVALID"
  | "UNAUTHORIZED"
  | "ERROR";

export interface TicketVerificationResponse {
  success: boolean;
  status: TicketVerificationStatus;
  message?: string;
  error?: string;
  checkedInAt?: Date | null;
  registration?: {
    id: string;
    eventId: string;
    name: string;
    email: string;
    phone: string | null;
    checkedIn: boolean;
    checkedInAt: Date | null;
    createdAt: Date;
  };
  event?: {
    id: string;
    title: string;
    location: string | null;
    startDate: Date;
    endDate: Date | null;
    imageUrl: string | null;
  };
}

export async function verifyEventTicketAction(
  ticketPayload: string,
  targetEventId?: string
): Promise<TicketVerificationResponse> {
  try {
    const { data: session } = await auth.getSession({
      fetchOptions: { headers: await headers() },
    });
    if (!session) {
      return { success: false, status: "UNAUTHORIZED", error: "Please log in to verify tickets." };
    }

    const allowed = await hasAnyPermission(session.user.id, [
      PERMISSIONS.EDIT_EVENT,
      PERMISSIONS.MANAGE_EVENTS,
      PERMISSIONS.VIEW_ADMIN_DASHBOARD,
    ]);
    if (!allowed) {
      return { success: false, status: "UNAUTHORIZED", error: "Missing required permissions to verify tickets." };
    }

    const ticketId = extractTicketIdFromPayload(ticketPayload);
    if (!ticketId) {
      return { success: false, status: "INVALID", error: "Empty or unreadable ticket code." };
    }

    // Lookup registration
    const registration = await prisma.eventRegistration.findUnique({
      where: { id: ticketId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            location: true,
            startDate: true,
            endDate: true,
            imageUrl: true,
          },
        },
      },
    });

    if (!registration) {
      // Also try searching by email if a specific event is selected and email was scanned
      if (targetEventId && ticketId.includes("@")) {
        const byEmail = await prisma.eventRegistration.findUnique({
          where: {
            eventId_email: {
              eventId: targetEventId,
              email: ticketId.toLowerCase(),
            },
          },
          include: {
            event: {
              select: {
                id: true,
                title: true,
                location: true,
                startDate: true,
                endDate: true,
                imageUrl: true,
              },
            },
          },
        });
        if (byEmail) {
          if (byEmail.checkedIn) {
            return {
              success: true,
              status: "ALREADY_CHECKED_IN" as const,
              registration: byEmail,
              event: byEmail.event,
              checkedInAt: byEmail.checkedInAt,
              message: "Attendee already checked in previously.",
            };
          }
          return {
            success: true,
            status: "VALID" as const,
            registration: byEmail,
            event: byEmail.event,
            message: "Valid ticket! Ready for admission.",
          };
        }
      }

      return {
        success: false,
        status: "INVALID" as const,
        error: "Ticket not found. This ticket code does not exist in records.",
      };
    }

    // 1. Check if event matches target event filter (if selected)
    if (targetEventId && targetEventId !== "all" && registration.eventId !== targetEventId) {
      return {
        success: true,
        status: "EVENT_MISMATCH" as const,
        registration,
        event: registration.event,
        message: `Event Mismatch: This ticket was issued for "${registration.event.title}", not the currently selected event.`,
      };
    }

    // 2. Check if already checked in
    if (registration.checkedIn) {
      return {
        success: true,
        status: "ALREADY_CHECKED_IN" as const,
        registration,
        event: registration.event,
        checkedInAt: registration.checkedInAt,
        message: `Already Checked In: This attendee was already admitted on ${new Date(registration.checkedInAt!).toLocaleTimeString("en-LK", { timeZone: "Asia/Colombo", hour: "2-digit", minute: "2-digit" })}.`,
      };
    }

    // 3. Valid ticket, ready for check-in
    return {
      success: true,
      status: "VALID" as const,
      registration,
      event: registration.event,
      message: "Valid Ticket! Attendee is eligible for admission.",
    };
  } catch (err) {
    console.error("[verifyEventTicketAction] Unexpected error:", err);
    return { success: false, status: "ERROR", error: "Database error during ticket lookup." };
  }
}

// ─────────────────────────────────────────────
// CHECK-IN ATTENDEE ACTION
// ─────────────────────────────────────────────
export async function checkInAttendeeAction(registrationId: string) {
  try {
    const { data: session } = await auth.getSession({
      fetchOptions: { headers: await headers() },
    });
    if (!session) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    const allowed = await hasAnyPermission(session.user.id, [
      PERMISSIONS.EDIT_EVENT,
      PERMISSIONS.MANAGE_EVENTS,
      PERMISSIONS.VIEW_ADMIN_DASHBOARD,
    ]);
    if (!allowed) {
      return { success: false, error: "Access denied. Missing permission." };
    }

    const ip = await getClientIP();

    const reg = await prisma.eventRegistration.findUnique({
      where: { id: registrationId },
      include: { event: { select: { title: true } } },
    });

    if (!reg) {
      return { success: false, error: "Registration record not found." };
    }

    const updated = await prisma.eventRegistration.update({
      where: { id: registrationId },
      data: {
        checkedIn: true,
        checkedInAt: new Date(),
      },
      include: { event: true },
    });

    await logAudit({
      userId: session.user.id,
      action: "EVENT_REGISTRATION_CHECKED_IN",
      entity: "EventRegistration",
      entityId: registrationId,
      newState: {
        name: updated.name,
        email: updated.email,
        event: updated.event.title,
        checkedInAt: updated.checkedInAt,
      },
      ipAddress: ip,
    });

    revalidatePath("/admin/events");
    revalidatePath("/admin/events/verify");

    return { success: true, registration: updated };
  } catch (err) {
    console.error("[checkInAttendeeAction] Error:", err);
    return { success: false, error: "Failed to record check-in." };
  }
}

// ─────────────────────────────────────────────
// UNDO CHECK-IN ATTENDEE ACTION
// ─────────────────────────────────────────────
export async function undoCheckInAttendeeAction(registrationId: string) {
  try {
    const { data: session } = await auth.getSession({
      fetchOptions: { headers: await headers() },
    });
    if (!session) {
      return { success: false, error: "Unauthorized." };
    }

    const allowed = await hasAnyPermission(session.user.id, [
      PERMISSIONS.EDIT_EVENT,
      PERMISSIONS.MANAGE_EVENTS,
      PERMISSIONS.VIEW_ADMIN_DASHBOARD,
    ]);
    if (!allowed) {
      return { success: false, error: "Access denied." };
    }

    const ip = await getClientIP();

    const updated = await prisma.eventRegistration.update({
      where: { id: registrationId },
      data: {
        checkedIn: false,
        checkedInAt: null,
      },
      include: { event: true },
    });

    await logAudit({
      userId: session.user.id,
      action: "EVENT_REGISTRATION_CHECK_IN_REVERTED",
      entity: "EventRegistration",
      entityId: registrationId,
      newState: {
        name: updated.name,
        email: updated.email,
        event: updated.event.title,
        checkedIn: false,
      },
      ipAddress: ip,
    });

    revalidatePath("/admin/events");
    revalidatePath("/admin/events/verify");

    return { success: true, registration: updated };
  } catch (err) {
    console.error("[undoCheckInAttendeeAction] Error:", err);
    return { success: false, error: "Failed to revert check-in." };
  }
}

