---
name: seds-jpura-certificates
description: Cryptographic certificate generation, QR code verification, hash extraction, and bulk issuance workflows for SEDS J'pura. Use when working on credential issuance, QR scanner features, verification algorithms, or certificate templates.
---

# SEDS J'pura Cryptographic Certificates Skill

## Overview
This skill details the architecture and operational workflows for the verifiable credential system in SEDS J'pura, including cryptographic hash generation, canonical verification URLs, QR scanning, and Excel bulk processing.

---

## 1. Cryptographic Hash Signature

Every certificate issued has a unique, deterministic 64-character SHA-256 hash generated via Node's `crypto`:

```typescript
import crypto from "crypto";

const certDataString = `${certId}-${recipientEmail.toLowerCase()}-${recipientName}-${Date.now()}-${crypto.randomBytes(8).toString("hex")}`;
const hash = crypto.createHash("sha256").update(certDataString).digest("hex");
```

---

## 2. Canonical URL Resolution & Domain Locking

Implemented in [lib/certificate-url.ts](file:///d:/SEDs/25_26/SEDS%20JPURA/WEBSITE/seds-jpura/lib/certificate-url.ts).

### Purpose:
Ensures physical certificates or digital credentials bakes in the immutable production URL `https://jpura.sedssl.org` (or configured `NEXT_PUBLIC_APP_URL`), even if generated inside a local developer environment (`localhost:3000`) or preview deploy.

```typescript
export function getCertificateVerifyUrl(hash: string): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  let origin = "https://jpura.sedssl.org";

  if (envUrl && envUrl.trim() && !envUrl.includes("localhost")) {
    origin = envUrl.trim().replace(/\/+$/, "");
  }

  return `${origin}/certificates/verify?hash=${encodeURIComponent(hash)}`;
}
```

---

## 3. Universal Hash Extraction from QR Payloads

When a camera scans a QR code, the payload could be:
1. A direct 64-character hexadecimal string
2. A URL containing `?hash=<64-char>`
3. A URL containing `&hash=<64-char>`
4. An embedded hash within arbitrary text

The function `extractHashFromQrPayload(payload: string): string | null` handles all 4 variants cleanly without throwing exceptions.

---

## 4. QR Scanner Engine (`jsqr`)

Located in [components/certificates/QrScannerModal.tsx](file:///d:/SEDs/25_26/SEDS%20JPURA/WEBSITE/seds-jpura/components/certificates/QrScannerModal.tsx):
- Requests camera permission via `navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })`.
- Streams frames to an HTML5 canvas at `requestAnimationFrame`.
- Decodes video frames using `jsQR(imageData.data, width, height)`.
- On match, calls `onDetected(extractedHash)` and closes the camera stream immediately to save battery.

---

## 5. Single & Bulk Certificate Issuance

### Server Actions:
- `issueCertificateAction(data)`: Issues one credential, computes hash, verifies clearance (`ISSUE_CERTIFICATE`), creates audit log.
- `issueBulkCertificatesAction(certs)`: Processes a batch parsed from Excel, inserts credentials in bulk, logs audit event.
- `revokeCertificateAction(id, status)`: Transitions certificate state between `VALID`, `REVOKED`, and `EXPIRED`.

### Excel Columns Required:
`Certificate ID`, `Recipient Name`, `Recipient Email`, `Credential Type`, `Description`, `Expiry Date`.
Template generation and reading is handled using `xlsx` in [app/admin/certificates/CertificatesClient.tsx](file:///d:/SEDs/25_26/SEDS%20JPURA/WEBSITE/seds-jpura/app/admin/certificates/CertificatesClient.tsx).
