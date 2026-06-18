import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Warning: Supabase environment variables NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are not defined in current execution context."
  );
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder-url.supabase.co",
  supabaseAnonKey || "placeholder-key"
);

/**
 * Uploads a file to a Supabase storage bucket and returns its public URL.
 * @param file The file object to upload
 * @param bucket The name of the Supabase storage bucket (defaults to 'seds-media')
 * @returns Public URL of the uploaded file
 */
export async function uploadFile(file: File, bucket: string = "seds-media"): Promise<string> {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase client is not configured. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are specified in environment configuration."
    );
  }

  // Sanitize name and generate unique file key using timestamp
  const fileParts = file.name.split(".");
  const fileExt = fileParts.pop();
  const cleanBaseName = fileParts
    .join(".")
    .replace(/[^a-zA-Z0-9]/g, "_");
  const fileName = `${Date.now()}_${cleanBaseName}.${fileExt}`;

  // Upload file to the storage bucket
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw error;
  }

  // Retrieve public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);

  return publicUrl;
}
