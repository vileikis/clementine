// QR code generation utilities for share URLs and result share links
// Uses qrcode library with error correction level M and 512x512px output

import QRCode from "qrcode";
import { uploadQrCode } from "@/lib/storage/upload";

const QR_CONFIG = {
  errorCorrectionLevel: "M" as const,
  type: "png" as const,
  width: 512,
};

/**
 * Generates QR code for a URL and uploads to Storage at the specified path.
 * This is the primary function - use this for projects.
 *
 * @param url - The URL to encode in the QR code
 * @param storagePath - The storage path to upload to (e.g., projects/{id}/qr/share.png)
 */
export async function generateQrToPath(
  url: string,
  storagePath: string
): Promise<string> {
  const qrBuffer = await QRCode.toBuffer(url, QR_CONFIG);
  await uploadQrCode(storagePath, qrBuffer);
  return storagePath;
}

/**
 * @deprecated Use generateQrToPath instead. This uses legacy event paths.
 * Generates QR code for event join URL and uploads to Storage
 * Path: events/{eventId}/qr/join.png
 */
export async function generateJoinQr(
  eventId: string,
  joinUrl: string
): Promise<string> {
  const storagePath = `events/${eventId}/qr/join.png`;
  return generateQrToPath(joinUrl, storagePath);
}

/**
 * Generates QR code for session result share URL and uploads to Storage
 * Path: projects/{projectId}/qr/sessions/{sessionId}.png
 */
export async function generateResultQr(
  projectId: string,
  sessionId: string,
  shareUrl: string
): Promise<string> {
  const storagePath = `projects/${projectId}/qr/sessions/${sessionId}.png`;
  return generateQrToPath(shareUrl, storagePath);
}

/**
 * Generates QR code buffer without uploading (for on-the-fly generation)
 */
export async function generateQrBuffer(url: string): Promise<Buffer> {
  return QRCode.toBuffer(url, QR_CONFIG);
}
