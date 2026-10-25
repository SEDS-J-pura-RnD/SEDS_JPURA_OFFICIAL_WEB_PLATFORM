/**
 * Uploads an image or file to Neon S3 storage via the application's secure API endpoint.
 * @param file The File object to upload
 * @param bucket Optional bucket name (defaults to 'seds-jp-web-storage')
 * @returns The resolved accessible URL of the uploaded object
 */
export async function uploadFile(
  file: File,
  bucket: string = "seds-jp-web-storage"
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("bucket", bucket);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Upload failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.url;
}
