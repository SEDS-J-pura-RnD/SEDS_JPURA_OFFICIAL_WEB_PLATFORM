/**
 * Extracts and normalizes the Ticket/Registration ID from scanned QR payloads,
 * URLs, or JSON text.
 */
export function extractTicketIdFromPayload(payload: string): string {
  if (!payload) return "";
  const trimmed = payload.trim();

  // 1. JSON payload
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.regId) return String(parsed.regId).trim();
      if (parsed.ticketId) return String(parsed.ticketId).trim();
      if (parsed.id) return String(parsed.id).trim();
    } catch {
      // not JSON
    }
  }

  // 2. URL parsing
  try {
    const url = new URL(trimmed);
    const param =
      url.searchParams.get("ticketId") ||
      url.searchParams.get("id") ||
      url.searchParams.get("regId") ||
      url.searchParams.get("ticket");
    if (param) return param.trim();

    // Check pathname: e.g. /tickets/cm... or /verify/cm...
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length > 0) {
      const last = parts[parts.length - 1];
      if (last.length >= 10) return last;
    }
  } catch {
    // Not full URL
  }

  // 3. Regex fallback for URL parameters
  const match = trimmed.match(/[?&](?:ticketId|regId|id|ticket)=([a-zA-Z0-9_\-]+)/i);
  if (match && match[1]) {
    return match[1].trim();
  }

  return trimmed;
}
