// QR code generation utilities for join URLs and result share links
// Uses qrcode library with error correction level M and 512x512px output

import QRCode from "qrcode";
import { uploadQrCode } from "@/lib/storage/upload";

const QR_CONFIG = {
  errorCorrectionLevel: "M" as const,
  type: "png" as const,
  width: 512,
};

/**
 * Generates QR code for event join URL and uploads to Storage
 * Path: events/{eventId}/qr/join.png
 */
export async function generateJoinQr(
  eventId: string,
  joinUrl: string
): Promise<string> {
  const qrBuffer = await QRCode.toBuffer(joinUrl, QR_CONFIG);

  const storagePath = `events/${eventId}/qr/join.png`;
  await uploadQrCode(storagePath, qrBuffer);

  return storagePath;
}

/**
 * Generates QR code for session result share URL and uploads to Storage
 * Path: events/{eventId}/qr/sessions/{sessionId}.png
 */
export async function generateResultQr(
  eventId: string,
  sessionId: string,
  shareUrl: string
): Promise<string> {
  const qrBuffer = await QRCode.toBuffer(shareUrl, QR_CONFIG);

  const storagePath = `events/${eventId}/qr/sessions/${sessionId}.png`;
  await uploadQrCode(storagePath, qrBuffer);

  return storagePath;
}

/**
 * Generates QR code buffer without uploading (for on-the-fly generation)
 */
export async function generateQrBuffer(url: string): Promise<Buffer> {
  return QRCode.toBuffer(url, QR_CONFIG);
}
