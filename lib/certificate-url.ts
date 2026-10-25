/**
 * Resolves the canonical certificate verification URL for a given cryptographic hash.
 * Locks to the canonical domain from NEXT_PUBLIC_APP_URL (or fallback to production domain),
 * ensuring generated and printed QR codes never bake in temporary preview URLs or localhost.
 */
export function getCertificateVerifyUrl(hash: string): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  let origin = "https://jpura.sedssl.org";

  if (envUrl && envUrl.trim() && !envUrl.includes("localhost")) {
    origin = envUrl.trim().replace(/\/+$/, "");
  }

  return `${origin}/certificates/verify?hash=${encodeURIComponent(hash)}`;
}

/**
 * Extracts a 64-character SHA-256 hash from any scanned QR code payload.
 * It is completely domain-agnostic: whether the QR code was created with
 * http://localhost:3000, an old domain, a new domain, or raw hash text,
 * this function extracts the hash parameter cleanly.
 */
export function extractHashFromQrPayload(payload: string): string | null {
  if (!payload) return null;
  const trimmed = payload.trim();

  // 1. Direct 64-character hex hash
  if (/^[a-fA-F0-9]{64}$/.test(trimmed)) {
    return trimmed.toLowerCase();
  }

  // 2. Parsable URL with ?hash= or &hash=
  try {
    const url = new URL(trimmed);
    const hash = url.searchParams.get("hash");
    if (hash && /^[a-fA-F0-9]{64}$/.test(hash.trim())) {
      return hash.trim().toLowerCase();
    }
  } catch {
    // Not a valid URL constructor string, try regex below
  }

  // 3. Fallback regex to capture hash parameter anywhere in string
  const match = trimmed.match(/[?&]hash=([a-fA-F0-9]{64})/i);
  if (match && match[1]) {
    return match[1].toLowerCase();
  }

  // 4. Any 64-character hex sequence in the payload
  const hexMatch = trimmed.match(/[a-fA-F0-9]{64}/);
  if (hexMatch) {
    return hexMatch[0].toLowerCase();
  }

  return null;
}
