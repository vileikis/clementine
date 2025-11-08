"use client"

import { useState, useEffect } from "react"
import { generateQrCodeAction } from "@/app/actions/qr"

interface QRPanelProps {
  eventId: string
  joinUrl: string
  qrPngPath: string
}

export function QRPanel({ eventId, joinUrl, qrPngPath }: QRPanelProps) {
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadQrCode()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrPngPath])

  const loadQrCode = async () => {
    try {
      setIsGenerating(true)
      setError(null)

      const result = await generateQrCodeAction(eventId, joinUrl, qrPngPath)

      if (result.success && result.qrUrl) {
        setQrUrl(result.qrUrl)
      } else {
        setError(result.error || "Failed to load QR code")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load QR code")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch {
      setError("Failed to copy URL")
    }
  }

  const handleDownloadQr = () => {
    if (!qrUrl) return

    const link = document.createElement("a")
    link.href = qrUrl
    link.download = `event-${eventId}-qr.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleOpenGuestView = () => {
    window.open(joinUrl, "_blank")
  }

  return (
    <div className="space-y-6">
      {/* Join URL Section */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Join URL</h3>
        <div className="p-4 border rounded-lg space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={joinUrl}
              readOnly
              className="flex-1 px-3 py-2 border border-input rounded-md bg-muted font-mono text-sm"
            />
            <button
              onClick={handleCopyUrl}
              className="px-4 py-2 text-sm font-medium border border-input rounded-md hover:bg-muted transition-colors"
            >
              {isCopied ? "Copied!" : "Copy"}
            </button>
          </div>
          <button
            onClick={handleOpenGuestView}
            className="w-full px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Open Guest View
          </button>
        </div>
      </div>

      {/* QR Code Section */}
      <div>
        <h3 className="text-lg font-semibold mb-3">QR Code</h3>
        <div className="p-4 border rounded-lg space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {isGenerating ? (
            <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
              <div className="text-center space-y-2">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                <p className="text-sm text-muted-foreground">
                  Generating QR code...
                </p>
              </div>
            </div>
          ) : qrUrl ? (
            <>
              <div className="flex justify-center bg-white p-4 rounded-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrUrl}
                  alt="Event Join QR Code"
                  className="max-w-full h-auto"
                  style={{ maxWidth: "256px" }}
                />
              </div>
              <button
                onClick={handleDownloadQr}
                className="w-full px-4 py-2 text-sm font-medium border border-input rounded-md hover:bg-muted transition-colors"
              >
                Download QR Code
              </button>
            </>
          ) : null}
        </div>
      </div>

      {/* Instructions */}
      <div className="p-4 bg-muted rounded-lg">
        <h4 className="text-sm font-medium mb-2">How to use</h4>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>Share the join URL via email, SMS, or social media</li>
          <li>Display the QR code at your event for guests to scan</li>
          <li>Download the QR code to print or add to promotional materials</li>
        </ul>
      </div>
    </div>
  )
}
