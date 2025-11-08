"use server"

import { storage } from "@/lib/firebase/admin"
import { generateJoinQr } from "@/lib/qr/generate"
import { v4 as uuidv4 } from "uuid"

/**
 * Generates QR code for event join URL if it doesn't exist
 */
export async function generateQrCodeAction(
  eventId: string,
  joinUrl: string,
  qrPngPath: string
) {
  try {
    const file = storage.file(qrPngPath)

    // Check if file exists
    const [exists] = await file.exists()

    if (!exists) {
      // QR code doesn't exist, generate it
      await generateJoinQr(eventId, joinUrl)
    }

    // Get or set download token
    const [metadata] = await file.getMetadata()
    let token = metadata.metadata?.firebaseStorageDownloadTokens

    // If no token exists, create one
    if (!token) {
      token = uuidv4()
      await file.setMetadata({
        metadata: {
          firebaseStorageDownloadTokens: token,
        },
      })
    }

    const qrUrl = `https://firebasestorage.googleapis.com/v0/b/${storage.name}/o/${encodeURIComponent(qrPngPath)}?alt=media&token=${token}`

    return { success: true, qrUrl }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate QR code",
    }
  }
}
