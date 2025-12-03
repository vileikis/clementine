"use server"

import { storage } from "@/lib/firebase/admin"
import { generateQrToPath } from "./qr"
import { verifyAdminSecret } from "@/lib/auth"
import { v4 as uuidv4 } from "uuid"

/**
 * Generates QR code for project share URL if it doesn't exist.
 * Returns the download URL for the QR code image.
 *
 * @param projectId - The project ID (used for logging/context)
 * @param shareUrl - The URL to encode in the QR code
 * @param qrPngPath - The storage path for the QR code (e.g., projects/{id}/qr/share.png)
 */
export async function generateQrCodeAction(
  projectId: string,
  shareUrl: string,
  qrPngPath: string
) {
  // Verify admin authentication
  const auth = await verifyAdminSecret()
  if (!auth.authorized) {
    return { success: false, error: auth.error }
  }

  try {
    const file = storage.file(qrPngPath)

    // Check if file exists
    const [exists] = await file.exists()

    if (!exists) {
      // QR code doesn't exist, generate it at the correct path
      await generateQrToPath(shareUrl, qrPngPath)
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

/**
 * Forces regeneration of QR code for project share URL.
 * Deletes existing QR code and creates a new one.
 *
 * @param projectId - The project ID (used for logging/context)
 * @param shareUrl - The URL to encode in the QR code
 * @param qrPngPath - The storage path for the QR code (e.g., projects/{id}/qr/share.png)
 */
export async function regenerateQrCodeAction(
  projectId: string,
  shareUrl: string,
  qrPngPath: string
) {
  // Verify admin authentication
  const auth = await verifyAdminSecret()
  if (!auth.authorized) {
    return { success: false, error: auth.error }
  }

  try {
    const file = storage.file(qrPngPath)

    // Delete existing QR code if it exists
    const [exists] = await file.exists()
    if (exists) {
      await file.delete()
    }

    // Generate new QR code at the correct path
    await generateQrToPath(shareUrl, qrPngPath)

    // Create new download token
    const token = uuidv4()
    await file.setMetadata({
      metadata: {
        firebaseStorageDownloadTokens: token,
      },
    })

    const qrUrl = `https://firebasestorage.googleapis.com/v0/b/${storage.name}/o/${encodeURIComponent(qrPngPath)}?alt=media&token=${token}`

    return { success: true, qrUrl }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to regenerate QR code",
    }
  }
}
