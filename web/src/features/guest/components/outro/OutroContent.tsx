"use client"

import { useEventTheme } from "@/features/theming"
import { Button } from "@/components/ui/button"
import { Download, Share2, Mail, Instagram, Facebook, Twitter, Linkedin, MessageCircle } from "lucide-react"
import type { EventOutro, EventShareOptions, Event } from "@/features/events/types/event.types"
import type { ShareSocial } from "@/features/steps/types/step.types"
import { DEFAULT_EVENT_SHARE_OPTIONS } from "@/features/events/constants"

interface OutroContentProps {
  /** Outro configuration from event */
  outro: EventOutro
  /** Share options configuration from event */
  shareOptions?: EventShareOptions
  /** Event data for theme */
  event: Event
  /** URL of the AI-generated result image */
  resultImageUrl: string
  /** Optional click handler for CTA button - undefined for preview mode */
  onCtaClick?: () => void
}

// Social platform icons mapping
const SOCIAL_ICONS: Record<ShareSocial, typeof Instagram> = {
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
  tiktok: MessageCircle, // Using MessageCircle as placeholder for TikTok
  whatsapp: MessageCircle,
};

/**
 * Outro screen content component.
 * Displays AI result image, outro message, CTA button, and share options.
 *
 * This component is the single source of truth for outro screen UI.
 * Used by both guest flow (with onCtaClick) and admin preview (without).
 */
export function OutroContent({
  outro,
  shareOptions,
  event,
  resultImageUrl,
  onCtaClick,
}: OutroContentProps) {
  const { theme } = useEventTheme()

  // Use provided share options or defaults
  const activeShareOptions = shareOptions || DEFAULT_EVENT_SHARE_OPTIONS

  // Determine if CTA button should be shown
  const showCta = outro.ctaLabel?.trim() && outro.ctaUrl?.trim()

  // Determine if any share options are enabled
  const hasShareOptions =
    activeShareOptions.allowDownload ||
    activeShareOptions.allowSystemShare ||
    activeShareOptions.allowEmail ||
    (activeShareOptions.socials && activeShareOptions.socials.length > 0)

  const handleCtaClick = () => {
    if (onCtaClick) {
      onCtaClick()
    } else if (outro.ctaUrl) {
      // In preview mode or when no handler provided, open in new tab
      window.open(outro.ctaUrl, "_blank", "noopener,noreferrer")
    }
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(resultImageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `result-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Failed to download image:", error)
    }
  }

  const handleSystemShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.name,
          text: outro.title || "Check out my AI result!",
          url: window.location.href,
        })
      } catch (error) {
        console.error("Failed to share:", error)
      }
    }
  }

  const handleEmailShare = () => {
    const subject = encodeURIComponent(event.name)
    const body = encodeURIComponent(
      `${outro.title || "Check out my AI result!"}\n\n${window.location.href}`
    )
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  const handleSocialShare = (platform: ShareSocial) => {
    // Placeholder for social sharing - would integrate with platform-specific SDKs
    console.log(`Share to ${platform}:`, resultImageUrl)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Result image */}
      <div className="relative w-full aspect-[3/4] shrink-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={resultImageUrl}
          alt="AI generated result"
          className="h-full w-full object-cover"
        />
      </div>

      {/* Content area */}
      <div className="flex flex-col gap-4 p-4">
        {/* Title */}
        {outro.title && (
          <h1
            className="text-2xl font-bold"
            style={{
              color: theme.text.color,
              textAlign: theme.text.alignment,
            }}
          >
            {outro.title}
          </h1>
        )}

        {/* Description */}
        {outro.description && (
          <p
            className="text-base"
            style={{
              color: theme.text.color,
              textAlign: theme.text.alignment,
              opacity: 0.9,
            }}
          >
            {outro.description}
          </p>
        )}

        {/* CTA Button */}
        {showCta && (
          <div className="mt-2">
            <Button
              onClick={handleCtaClick}
              className="w-full"
              style={{
                backgroundColor: theme.button.backgroundColor || theme.primaryColor,
                color: theme.button.textColor,
                borderRadius: theme.button.radius === "none" ? "0" :
                              theme.button.radius === "sm" ? "0.25rem" :
                              theme.button.radius === "md" ? "0.5rem" :
                              theme.button.radius === "full" ? "9999px" : "0.5rem",
              }}
            >
              {outro.ctaLabel}
            </Button>
          </div>
        )}

        {/* Share Options */}
        {hasShareOptions && (
          <div className="mt-4 pt-4 border-t space-y-3">
            <h2
              className="text-sm font-semibold"
              style={{
                color: theme.text.color,
                textAlign: theme.text.alignment,
              }}
            >
              Share Your Result
            </h2>

            <div className="flex flex-col gap-2">
              {/* Download button */}
              {activeShareOptions.allowDownload && (
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  className="w-full justify-start gap-2"
                  style={{
                    borderColor: theme.primaryColor,
                    color: theme.text.color,
                  }}
                >
                  <Download className="h-4 w-4" />
                  Download Image
                </Button>
              )}

              {/* System share button */}
              {activeShareOptions.allowSystemShare && (
                <Button
                  onClick={handleSystemShare}
                  variant="outline"
                  className="w-full justify-start gap-2"
                  style={{
                    borderColor: theme.primaryColor,
                    color: theme.text.color,
                  }}
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              )}

              {/* Email share button */}
              {activeShareOptions.allowEmail && (
                <Button
                  onClick={handleEmailShare}
                  variant="outline"
                  className="w-full justify-start gap-2"
                  style={{
                    borderColor: theme.primaryColor,
                    color: theme.text.color,
                  }}
                >
                  <Mail className="h-4 w-4" />
                  Share via Email
                </Button>
              )}

              {/* Social platform buttons */}
              {activeShareOptions.socials && activeShareOptions.socials.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {activeShareOptions.socials.map((platform) => {
                    const Icon = SOCIAL_ICONS[platform]
                    return (
                      <Button
                        key={platform}
                        onClick={() => handleSocialShare(platform)}
                        variant="outline"
                        size="sm"
                        className="flex-col h-auto py-2 gap-1"
                        style={{
                          borderColor: theme.primaryColor,
                          color: theme.text.color,
                        }}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-xs capitalize">{platform}</span>
                      </Button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
