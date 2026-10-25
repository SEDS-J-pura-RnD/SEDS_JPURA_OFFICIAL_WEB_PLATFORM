import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const endpoint = process.env.AWS_ENDPOINT_URL_S3;
const region = process.env.AWS_REGION || "us-east-1";
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

export const DEFAULT_BUCKET = process.env.AWS_S3_BUCKET || "seds-jp-web-storage";

export const s3 = new S3Client({
  endpoint: endpoint || undefined,
  region,
  credentials:
    accessKeyId && secretAccessKey
      ? {
          accessKeyId,
          secretAccessKey,
        }
      : undefined,
  forcePathStyle: true,
});

/**
 * Resolves the public-facing URL for an object stored in S3.
 * If AWS_S3_PUBLIC_READ=true or NEXT_PUBLIC_S3_DIRECT_URL=true, it constructs a direct path-style S3 URL.
 * Otherwise, it defaults to the application's media proxy route (/api/media/[key]),
 * which securely streams the object without requiring public bucket permissions.
 */
export function getObjectUrl(key: string, bucket: string = DEFAULT_BUCKET): string {
  const isDirect =
    process.env.AWS_S3_PUBLIC_READ === "true" ||
    process.env.NEXT_PUBLIC_S3_DIRECT_URL === "true";

  if (isDirect && endpoint) {
    const cleanEndpoint = endpoint.replace(/\/+$/, "");
    return `${cleanEndpoint}/${bucket}/${encodeURIComponent(key)}`;
  }

  return `/api/media/${encodeURIComponent(key)}`;
}

/**
 * Uploads a file buffer directly to Neon S3 storage.
 */
export async function uploadToS3(params: {
  buffer: Buffer | Uint8Array;
  fileName: string;
  contentType: string;
  bucket?: string;
}): Promise<{ key: string; url: string }> {
  const bucket = params.bucket || DEFAULT_BUCKET;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: params.fileName,
    Body: params.buffer,
    ContentType: params.contentType,
  });

  await s3.send(command);

  return {
    key: params.fileName,
    url: getObjectUrl(params.fileName, bucket),
  };
}

/**
 * Generates a presigned GET URL for private object access.
 */
export async function getSignedDownloadUrl(
  key: string,
  bucket: string = DEFAULT_BUCKET,
  expiresIn: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return await getSignedUrl(s3, command, { expiresIn });
}

/**
 * Deletes an object from S3.
 */
export async function deleteFromS3(
  key: string,
  bucket: string = DEFAULT_BUCKET
): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  await s3.send(command);
}
