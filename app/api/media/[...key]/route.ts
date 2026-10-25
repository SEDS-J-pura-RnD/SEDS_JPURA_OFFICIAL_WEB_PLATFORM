import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3, DEFAULT_BUCKET } from "@/lib/s3";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ key: string[] }> }
) {
  try {
    const { key } = await props.params;

    if (!key || key.length === 0) {
      return NextResponse.json({ error: "Missing file key." }, { status: 400 });
    }

    const objectKey = key.map(decodeURIComponent).join("/");
    const bucket = req.nextUrl.searchParams.get("bucket") || DEFAULT_BUCKET;

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: objectKey,
    });

    const s3Response = await s3.send(command);

    if (!s3Response.Body) {
      return NextResponse.json({ error: "File not found." }, { status: 404 });
    }

    const headers = new Headers();
    if (s3Response.ContentType) {
      headers.set("Content-Type", s3Response.ContentType);
    }
    if (s3Response.ContentLength) {
      headers.set("Content-Length", s3Response.ContentLength.toString());
    }
    if (s3Response.ETag) {
      headers.set("ETag", s3Response.ETag);
    }
    // Cache media files for 1 year (immutable content by hash/timestamp key)
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    // AWS SDK v3 provides transformToWebStream in modern runtimes
    const webStream = typeof (s3Response.Body as any).transformToWebStream === "function"
      ? (s3Response.Body as any).transformToWebStream()
      : (s3Response.Body as any);

    return new Response(webStream, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    if (error.name === "NoSuchKey" || error.$metadata?.httpStatusCode === 404) {
      return NextResponse.json({ error: "File not found." }, { status: 404 });
    }

    console.error("Media route error:", error);
    return NextResponse.json(
      { error: "Error retrieving file from storage." },
      { status: 500 }
    );
  }
}
