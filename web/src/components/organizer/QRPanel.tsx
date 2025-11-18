"use client"

import { useState, useEffect } from "react"
import { generateQrCodeAction, regenerateQrCodeAction } from "@/lib/actions/qr"

interface QRPanelProps {
  eventId: string
  joinUrl: string
  qrPngPath: string
}

export function QRPanel({ eventId, joinUrl, qrPngPath }: QRPanelProps) {
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [copyError, setCopyError] = useState<string | null>(null)
  const [qrError, setQrError] = useState<string | null>(null)

  useEffect(() => {
    loadQrCode()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrPngPath])

  const loadQrCode = async () => {
    try {
      setIsGenerating(true)
      setQrError(null)

      const result = await generateQrCodeAction(eventId, joinUrl, qrPngPath)

      if (result.success && result.qrUrl) {
        setQrUrl(result.qrUrl)
      } else {
        setQrError(result.error || "Failed to load QR code")
      }
    } catch (err) {
      setQrError(err instanceof Error ? err.message : "Failed to load QR code")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRegenerateQr = async () => {
    try {
      setIsRegenerating(true)
      setQrError(null)

      const result = await regenerateQrCodeAction(eventId, joinUrl, qrPngPath)

      if (result.success && result.qrUrl) {
        setQrUrl(result.qrUrl)
      } else {
        setQrError(result.error || "Failed to regenerate QR code")
      }
    } catch (err) {
      setQrError(err instanceof Error ? err.message : "Failed to regenerate QR code")
    } finally {
      setIsRegenerating(false)
    }
  }

  const handleCopyUrl = async () => {
    try {
      setCopyError(null)

      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(joinUrl)
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
        return
      }

      // Fallback to older method
      const textArea = document.createElement("textarea")
      textArea.value = joinUrl
      textArea.style.position = "fixed"
      textArea.style.left = "-999999px"
      textArea.setAttribute("readonly", "")
      document.body.appendChild(textArea)
      textArea.select()

      const successful = document.execCommand("copy")
      document.body.removeChild(textArea)

      if (successful) {
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
      } else {
        throw new Error("Copy command failed")
      }
    } catch (err) {
      console.error("Copy failed:", err)
      setCopyError(
        err instanceof Error
          ? `Failed to copy: ${err.message}`
          : "Failed to copy URL. Please copy manually."
      )
      setTimeout(() => setCopyError(null), 3000)
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
          {copyError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{copyError}</p>
            </div>
          )}
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
          {qrError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{qrError}</p>
            </div>
          )}

          {isGenerating || isRegenerating ? (
            <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
              <div className="text-center space-y-2">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                <p className="text-sm text-muted-foreground">
                  {isRegenerating ? "Regenerating QR code..." : "Generating QR code..."}
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
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleDownloadQr}
                  className="px-4 py-2 text-sm font-medium border border-input rounded-md hover:bg-muted transition-colors"
                >
                  Download QR Code
                </button>
                <button
                  onClick={handleRegenerateQr}
                  disabled={isRegenerating}
                  className="px-4 py-2 text-sm font-medium border border-input rounded-md hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Regenerate QR Code
                </button>
              </div>
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
