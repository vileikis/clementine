import { useMemo } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import { generateGuestUrl } from '../../share/utils/shareUrl.utils'
import { useCopyToClipboard } from '../../share/hooks/useCopyToClipboard'
import { useQRCodeGenerator } from '../../share/hooks/useQRCodeGenerator'
import { ShareLinkSection } from '../../share/components/ShareLinkSection'
import { QRCodeDisplay } from '../../share/components/QRCodeDisplay'

const route = getRouteApi(
  '/workspace/$workspaceSlug/projects/$projectId/distribute',
)

export function DistributePage() {
  const { projectId } = route.useParams()

  const guestUrl = useMemo(() => generateGuestUrl(projectId), [projectId])

  const { copyToClipboard, isCopying, copySuccess } = useCopyToClipboard()
  const { qrOptions, regenerateQRCode, downloadQRCode, isDownloading } =
    useQRCodeGenerator(guestUrl, projectId)

  const handleCopy = () => {
    void copyToClipboard(guestUrl)
  }

  const handleDownload = () => {
    void downloadQRCode()
  }

  return (
    <div className="flex justify-center py-8">
      <div className="w-full max-w-md space-y-6 px-4">
        <h1 className="text-2xl font-semibold">Distribute</h1>

        <ShareLinkSection
          guestUrl={guestUrl}
          onCopy={handleCopy}
          copySuccess={copySuccess}
          isCopying={isCopying}
        />

        <QRCodeDisplay
          qrOptions={qrOptions}
          displaySize={256}
          onRegenerate={regenerateQRCode}
          onDownload={handleDownload}
          isDownloading={isDownloading}
        />

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
    </div>
  )
}
