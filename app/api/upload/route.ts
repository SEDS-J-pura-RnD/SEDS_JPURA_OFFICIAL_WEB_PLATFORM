import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { uploadToS3, DEFAULT_BUCKET } from "@/lib/s3";

export async function POST(req: NextRequest) {
  try {
    // Authenticate the request
    const { data: session } = await auth.getSession({
      fetchOptions: { headers: await headers() },
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized. You must be signed in to upload files." },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const bucket = (formData.get("bucket") as string) || DEFAULT_BUCKET;

    if (!file) {
      return NextResponse.json({ error: "No file provided in form data." }, { status: 400 });
    }

    // Limit upload size to 10MB
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds the 10MB upload limit." },
        { status: 400 }
      );
    }

    // Sanitize and generate unique file key
    const fileParts = file.name.split(".");
    const fileExt = fileParts.pop() || "bin";
    const cleanBaseName = fileParts.join(".").replace(/[^a-zA-Z0-9]/g, "_");
    const fileName = `${Date.now()}_${cleanBaseName}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadToS3({
      buffer,
      fileName,
      contentType: file.type || "application/octet-stream",
      bucket,
    });

    return NextResponse.json({
      success: true,
      url: result.url,
      key: result.key,
    });
  } catch (error: any) {
    console.error("Upload route error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload file to Neon S3." },
      { status: 500 }
    );
  }
}
