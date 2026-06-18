import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { isAdmin } from "@/lib/permissions";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { data: session } = await auth.getSession({ fetchOptions: { headers: await headers() } });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isUserAdmin = await isAdmin(session.user.id);
    if (!isUserAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const permissions = await prisma.permission.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(permissions);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
