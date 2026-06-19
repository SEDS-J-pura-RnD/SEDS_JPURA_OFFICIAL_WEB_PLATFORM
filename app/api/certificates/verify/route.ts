import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const hash = searchParams.get("hash");

  if (!hash) {
    return NextResponse.json({ valid: false, message: "Cryptographic hash signature is required." }, { status: 400 });
  }

  // Rate limiting: log the IP
  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    undefined;

  try {
    const cert = await prisma.certificate.findUnique({
      where: { hash: hash.trim() },
    });

    if (!cert) {
      await logAudit({
        action: "CERTIFICATE_VERIFIED",
        entity: "Certificate",
        prevState: { hash, result: "NOT_FOUND" },
        ipAddress,
      });
      return NextResponse.json({ valid: false, message: "Certificate not found in our records." });
    }

    if (cert.status === "REVOKED") {
      await logAudit({ action: "CERTIFICATE_VERIFIED", entity: "Certificate", entityId: cert.id, prevState: { result: "REVOKED" }, ipAddress });
      return NextResponse.json({ valid: false, message: "This certificate has been revoked." });
    }

    if (cert.status === "EXPIRED" || (cert.expiryDate && new Date() > cert.expiryDate)) {
      return NextResponse.json({ valid: false, message: "This certificate has expired." });
    }

    await logAudit({ action: "CERTIFICATE_VERIFIED", entity: "Certificate", entityId: cert.id, newState: { result: "VALID" }, ipAddress });

    return NextResponse.json({
      valid: true,
      data: {
        certId: cert.certId,
        recipientName: cert.recipientName,
        type: cert.type,
        issueDate: cert.issueDate.toLocaleDateString("en-LK", { day: "numeric", month: "long", year: "numeric" }),
        issuedBy: cert.issuedBy || "SEDS Jpura",
        status: cert.status,
        hash: cert.hash,
        ...(cert.description && { description: cert.description }),
      },
    });
  } catch (err) {
    console.error("[Certificate Verify API]", err);
    return NextResponse.json({ valid: false, message: "Verification service error." }, { status: 500 });
  }
}
