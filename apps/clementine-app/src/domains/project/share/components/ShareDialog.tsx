/**
 * Share Dialog Component
 * Feature: 011-project-share-dialog
 */

import { useMemo } from 'react'
import { generateGuestUrl } from '../utils/shareUrl.utils'
import { useCopyToClipboard } from '../hooks/useCopyToClipboard'
import { useQRCodeGenerator } from '../hooks/useQRCodeGenerator'
import { QRCodeDisplay } from './QRCodeDisplay'
import { ShareLinkSection } from './ShareLinkSection'
import type { ShareDialogProps } from '../types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/ui-kit/ui/dialog'

/**
 * Main share dialog component
 * Displays guest URL and QR code for project sharing
 *
 * Phases:
 * - Phase 3 (US1): Link copy functionality
 * - Phase 4 (US2): QR code display
 * - Phase 5 (US3): QR regenerate and download
 * - Phase 6 (US4): Help instructions
 *
 * @param props - Component props
 * @returns ShareDialog component
 */
export function ShareDialog({
  projectId,
  open,
  onOpenChange,
}: ShareDialogProps) {
  // Generate guest URL (memoized to prevent unnecessary recalculations)
  const guestUrl = useMemo(() => generateGuestUrl(projectId), [projectId])

  // Clipboard copy functionality
  const { copyToClipboard, isCopying, copySuccess } = useCopyToClipboard()

  // QR code generation and management
  const { qrOptions, regenerateQRCode, downloadQRCode, isDownloading } =
    useQRCodeGenerator(guestUrl, projectId)

  const handleCopy = () => {
    void copyToClipboard(guestUrl)
  }

  const handleDownload = () => {
    void downloadQRCode()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share Project</DialogTitle>
          <DialogDescription>
            Share this project with guests at your event
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Phase 3 (US1): Link copy section */}
          <ShareLinkSection
            guestUrl={guestUrl}
            onCopy={handleCopy}
            copySuccess={copySuccess}
            isCopying={isCopying}
          />

          {/* Phase 4 (US2): QR code display with Phase 5 (US3): regenerate/download */}
          <QRCodeDisplay
            qrOptions={qrOptions}
            displaySize={256}
            onRegenerate={regenerateQRCode}
            onDownload={handleDownload}
            isDownloading={isDownloading}
          />

          {/* Phase 6 (US4): Help instructions */}
          <div className="space-y-2 rounded-lg border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">How to use:</p>
            <ul className="list-inside list-disc space-y-1">
              <li>Share the URL via email, SMS, or social media</li>
              <li>Display the QR code at your event for guests to scan</li>
              <li>
                Download the QR code to print or add to promotional materials
              </li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
