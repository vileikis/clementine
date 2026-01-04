/**
 * QR Code generation hook
 * Feature: 011-project-share-dialog
 */

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { downloadQRCodeAsPng } from '../utils/qrDownload.utils'
import type { GuestUrl, QRCodeOptions } from '../types'

export interface UseQRCodeGeneratorReturn {
  /**
   * Current QR code options
   */
  qrOptions: QRCodeOptions

  /**
   * Regenerate QR code with new visual pattern
   * (Appends timestamp query param to URL to change QR appearance)
   */
  regenerateQRCode: () => void

  /**
   * Download QR code as PNG image
   * (Phase 5 - US3)
   */
  downloadQRCode: () => Promise<void>

  /**
   * Whether download is in progress
   */
  isDownloading: boolean
}

/**
 * Hook for generating and managing QR codes
 * Provides regeneration and download capabilities
 *
 * @param guestUrl - Guest URL to encode in QR code
 * @param projectId - Project ID for filename generation
 * @returns QR code generator functions and state
 *
 * @example
 * const { qrOptions, regenerateQRCode, downloadQRCode } = useQRCodeGenerator(guestUrl, projectId);
 */
export function useQRCodeGenerator(
  guestUrl: GuestUrl,
  projectId?: string,
): UseQRCodeGeneratorReturn {
  // QR seed for regeneration (different seed = different visual pattern)
  const [qrSeed, setQrSeed] = useState<number>(Date.now())
  const [isDownloading, setIsDownloading] = useState(false)

  // Memoize QR options to prevent unnecessary re-renders
  // Append seed as query param to change QR visual pattern (react-qr-code is deterministic on value)
  const qrOptions: QRCodeOptions = useMemo(
    () => ({
      value: `${guestUrl}?_qr=${qrSeed}` as GuestUrl,
      size: 512,
      level: 'M', // Medium error correction (15% damage tolerance)
      fgColor: '#000000', // Black QR modules
      bgColor: '#FFFFFF', // White background
      seed: qrSeed,
    }),
    [guestUrl, qrSeed],
  )

  const regenerateQRCode = () => {
    setQrSeed(Date.now())
    toast.success('QR code regenerated with new pattern')
  }

  const downloadQRCode = async (): Promise<void> => {
    setIsDownloading(true)
    try {
      // Get SVG element from DOM (rendered by react-qr-code)
      const svgElement = document.querySelector<SVGElement>('[data-qr-code]')
      if (!svgElement) {
        throw new Error('QR code element not found')
      }

      // Download as 512x512 PNG for print quality
      await downloadQRCodeAsPng(svgElement, projectId || 'project', 512)
      toast.success('QR code downloaded')
    } catch (error) {
      toast.error('Failed to download QR code. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  return {
    qrOptions,
    regenerateQRCode,
    downloadQRCode,
    isDownloading,
  }
}
