/**
 * QR Code Display Component
 * Feature: 011-project-share-dialog
 */

import QRCodeSVG from 'react-qr-code'
import { Download, RefreshCw } from 'lucide-react'
import type { GuestUrl, QRCodeErrorLevel } from '../types'
import { Button } from '@/ui-kit/components/button'

export interface QRCodeDisplayProps {
  /**
   * Guest URL to encode in QR code
   */
  guestUrl: GuestUrl

  /**
   * QR code size in pixels
   * @default 256 (display size in dialog)
   */
  size?: number

  /**
   * Error correction level
   * @default 'M' (Medium - 15% tolerance)
   */
  level?: QRCodeErrorLevel

  /**
   * Random seed for visual variation
   */
  seed?: number

  /**
   * Callback when regenerate button clicked
   * (Phase 5 - US3)
   */
  onRegenerate?: () => void

  /**
   * Callback when download button clicked
   * (Phase 5 - US3)
   */
  onDownload?: () => void

  /**
   * Whether download is in progress
   * (Phase 5 - US3)
   */
  isDownloading?: boolean
}

/**
 * Component for displaying QR code with regenerate and download controls
 * Phase 2 (US2): QR code display
 * Phase 5 (US3): Regenerate and download buttons
 *
 * @param props - Component props
 * @returns QRCodeDisplay component
 */
export function QRCodeDisplay({
  guestUrl,
  size = 256,
  level = 'M',
  seed,
  onRegenerate,
  onDownload,
  isDownloading = false,
}: QRCodeDisplayProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-center rounded-lg border border-border bg-background p-4">
        <QRCodeSVG
          value={guestUrl}
          size={size}
          level={level}
          fgColor="#000000"
          bgColor="#FFFFFF"
          data-qr-code // Used for DOM selection in download functionality
          data-seed={seed} // Track seed for testing
        />
      </div>

      {/* Phase 5 (US3): Regenerate and Download buttons */}
      {onRegenerate && onDownload && (
        <div className="flex gap-2">
          <Button
            onClick={onRegenerate}
            variant="outline"
            className="flex-1"
            aria-label="Regenerate QR code with new visual pattern"
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            <span className="ml-2">Regenerate</span>
          </Button>
          <Button
            onClick={onDownload}
            variant="outline"
            className="flex-1"
            disabled={isDownloading}
            aria-label={
              isDownloading ? 'Downloading QR code' : 'Download QR code as PNG'
            }
          >
            <Download className="size-4" aria-hidden="true" />
            <span className="ml-2">
              {isDownloading ? 'Downloading...' : 'Download'}
            </span>
          </Button>
        </div>
      )}
    </div>
  )
}
