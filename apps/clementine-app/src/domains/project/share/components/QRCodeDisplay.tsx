/**
 * QR Code Display Component
 * Feature: 011-project-share-dialog
 */

import QRCodeSVG from 'react-qr-code'
import { Download, RefreshCw } from 'lucide-react'
import type { QRCodeOptions } from '../types'
import { Button } from '@/ui-kit/components/button'

export interface QRCodeDisplayProps {
  /**
   * QR code generation options from hook
   * Contains value, size, level, colors, and seed
   */
  qrOptions: QRCodeOptions

  /**
   * Override display size (for dialog vs download)
   * If not provided, uses qrOptions.size
   * @default qrOptions.size
   */
  displaySize?: number

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
  qrOptions,
  displaySize,
  onRegenerate,
  onDownload,
  isDownloading = false,
}: QRCodeDisplayProps) {
  const size = displaySize ?? qrOptions.size ?? 256

  return (
    <div className="space-y-4">
      <div className="flex justify-center rounded-lg border border-border bg-background p-4">
        <QRCodeSVG
          value={qrOptions.value}
          size={size}
          level={qrOptions.level ?? 'M'}
          fgColor={qrOptions.fgColor ?? '#000000'}
          bgColor={qrOptions.bgColor ?? '#FFFFFF'}
          data-qr-code // Used for DOM selection in download functionality
          data-seed={qrOptions.seed} // Track seed for testing
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
