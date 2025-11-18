"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { BrandColorPicker } from "./BrandColorPicker"
import { updateEventBrandingAction } from "@/lib/actions/events"

interface BrandingFormProps {
  eventId: string
  eventTitle: string
  initialBrandColor: string
  initialShowTitleOverlay: boolean
}

export function BrandingForm({
  eventId,
  eventTitle,
  initialBrandColor,
  initialShowTitleOverlay,
}: BrandingFormProps) {
  const [brandColor, setBrandColor] = useState(initialBrandColor)
  const [showTitleOverlay, setShowTitleOverlay] = useState(
    initialShowTitleOverlay
  )
  const [isLoading, setIsLoading] = useState(false)
  const [isSaved, setIsSaved] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Track unsaved changes
  useEffect(() => {
    const hasChanges =
      brandColor !== initialBrandColor ||
      showTitleOverlay !== initialShowTitleOverlay
    setIsSaved(!hasChanges)
  }, [brandColor, showTitleOverlay, initialBrandColor, initialShowTitleOverlay])

  const handleSave = async () => {
    if (isLoading || isSaved) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await updateEventBrandingAction(eventId, {
        brandColor,
        showTitleOverlay,
      })

      if (result.success) {
        setIsSaved(true)
      } else {
        setError(result.error || "Failed to save branding")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save branding")
    } finally {
      setIsLoading(false)
    }
  }

  const handleColorChange = (color: string) => {
    setBrandColor(color)
  }

  const handleToggleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowTitleOverlay(e.target.checked)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Settings Panel */}
      <div className="space-y-6">
        <section>
          <h3 className="text-lg font-semibold mb-4">Brand Color</h3>
          <BrandColorPicker
            value={brandColor}
            onChange={handleColorChange}
            disabled={isLoading}
          />
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-4">Title Overlay</h3>
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showTitleOverlay}
                onChange={handleToggleChange}
                disabled={isLoading}
                className="sr-only peer"
              />
              <div
                className={cn(
                  "w-11 h-6 rounded-full transition-colors",
                  "peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-offset-2 peer-focus:ring-foreground",
                  "bg-muted peer-checked:bg-foreground",
                  "after:content-[''] after:absolute after:top-[2px] after:left-[2px]",
                  "after:bg-background after:rounded-full after:h-5 after:w-5",
                  "after:transition-all peer-checked:after:translate-x-5",
                  isLoading && "opacity-50 cursor-not-allowed"
                )}
              />
            </label>
            <span className="text-sm">
              {showTitleOverlay ? "Show" : "Hide"} event title on guest screen
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            When enabled, the event title will appear at the top of the guest
            experience.
          </p>
        </section>

        {/* Save Button and Status */}
        <div className="space-y-3">
          <button
            onClick={handleSave}
            disabled={isLoading || isSaved}
            className={cn(
              "w-full px-4 py-2 rounded-md font-medium transition-colors",
              "border-2 border-border",
              isSaved
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-foreground text-background hover:bg-foreground/90",
              isLoading && "opacity-50 cursor-not-allowed"
            )}
          >
            {isLoading ? "Saving..." : isSaved ? "Saved" : "Save Changes"}
          </button>

          {error && <p className="text-sm text-red-500">{error}</p>}

          {isSaved && !isLoading && !error && (
            <p className="text-sm text-green-600">✓ Branding saved successfully</p>
          )}
        </div>
      </div>

      {/* Preview Panel */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Live Preview</h3>
        <div className="border-2 border-border rounded-lg overflow-hidden">
          {/* Mock mobile screen */}
          <div className="bg-background aspect-[9/16] max-h-[600px] relative">
            {/* Preview content - simulating guest greeting screen */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center"
              style={{
                background: `linear-gradient(135deg, ${brandColor}15 0%, ${brandColor}05 100%)`,
              }}
            >
              {showTitleOverlay && (
                <h1
                  className="text-3xl font-bold mb-4"
                  style={{ color: brandColor }}
                >
                  {eventTitle}
                </h1>
              )}

              <div className="space-y-6 w-full max-w-sm">
                <div className="text-center">
                  <p className="text-lg text-muted-foreground mb-8">
                    Welcome to your AI photobooth experience!
                  </p>
                </div>

                {/* Mock button */}
                <button
                  className="w-full py-4 px-6 rounded-lg font-semibold text-white text-lg transition-all"
                  style={{ backgroundColor: brandColor }}
                >
                  Get Started
                </button>

                <p className="text-xs text-muted-foreground text-center">
                  Preview of guest experience
                </p>
              </div>
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          This preview shows how your branding will appear to guests on their mobile
          device.
        </p>
      </div>
    </div>
  )
}
