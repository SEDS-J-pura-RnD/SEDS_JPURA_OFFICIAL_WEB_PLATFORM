import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { contactSchema } from "@/lib/validations";
import { logAudit } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      undefined;

    const inquiry = await prisma.contactInquiry.create({
      data: {
        ...parsed.data,
        ipAddress,
      },
    });

    await logAudit({
      action: "CONTACT_RECEIVED",
      entity: "ContactInquiry",
      entityId: inquiry.id,
      newState: { name: parsed.data.name, email: parsed.data.email, subject: parsed.data.subject },
      ipAddress,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("[Contact API]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
