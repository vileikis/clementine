"use client";

// ============================================================================
// RewardStep Renderer
// ============================================================================
// Renders reward step for Experience Engine.
// Displays transformation result with sharing options.

import Image from "next/image";
import { Download, Share2, Mail, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { StepLayout, ActionButton } from "@/components/step-primitives";
import { useEventTheme } from "@/features/theming";
import type { StepReward, ShareSocial } from "@/features/steps/types";
import type { StepRendererProps } from "../../types";
import { Skeleton } from "@/components/ui/skeleton";

type RewardStepProps = StepRendererProps<StepReward>;

/** Social media icon mapping */
const SOCIAL_ICONS: Record<ShareSocial, string> = {
  instagram: "📷",
  facebook: "📘",
  twitter: "𝕏",
  linkedin: "💼",
  tiktok: "🎵",
  whatsapp: "💬",
};

/** Social media labels */
const SOCIAL_LABELS: Record<ShareSocial, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  twitter: "X",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  whatsapp: "WhatsApp",
};

export function RewardStep({
  step,
  transformStatus,
  onCtaClick,
}: RewardStepProps) {
  const { buttonBgColor, buttonTextColor, buttonRadius } = useEventTheme();

  const resultUrl = transformStatus.resultUrl;
  const isLoading = !resultUrl && transformStatus.status !== "error";
  const hasError = transformStatus.status === "error";

  const config = step.config ?? {
    allowDownload: true,
    allowSystemShare: true,
    allowEmail: false,
    socials: [],
  };

  const hasShareOptions =
    config.allowDownload ||
    config.allowSystemShare ||
    config.allowEmail ||
    config.socials.length > 0;

  // Handle download
  const handleDownload = async () => {
    if (!resultUrl) return;
    try {
      const response = await fetch(resultUrl);
      if (!response.ok) {
        throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "transformed-image.jpg";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Download failed. Please try again.");
    }
  };

  // Handle system share
  const handleShare = async () => {
    if (!resultUrl || !navigator.share) return;
    try {
      await navigator.share({
        title: step.title || "Check out my result!",
        url: resultUrl,
      });
    } catch (error) {
      // User cancelled or share failed
      console.log("Share cancelled or failed:", error);
    }
  };

  return (
    <StepLayout
      mediaUrl={step.mediaUrl}
      mediaType={step.mediaType}
      action={
        step.ctaLabel && <ActionButton onClick={onCtaClick}>{step.ctaLabel}</ActionButton>
      }
    >
      <div className="flex-1 flex flex-col">
        {/* Title */}
        {step.title && <h2 className="text-2xl font-bold mb-2">{step.title}</h2>}

        {/* Description */}
        {step.description && (
          <p className="text-sm opacity-80 mb-4">{step.description}</p>
        )}

        {/* Result Image - responsive sizing */}
        <div className="flex-1 flex items-center justify-center py-4">
          <div className="w-[70%] lg:w-[50%] lg:max-w-[300px] aspect-[3/4] rounded-lg overflow-hidden relative shadow-lg">
            {isLoading ? (
              <Skeleton className="w-full h-full" />
            ) : hasError ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-muted">
                <AlertCircle className="h-12 w-12 text-destructive mb-2" />
                <p className="text-sm text-muted-foreground text-center px-4">
                  {transformStatus.errorMessage || "Failed to load result"}
                </p>
              </div>
            ) : resultUrl ? (
              <Image
                src={resultUrl}
                alt="AI transformed result"
                fill
                className="object-cover"
                unoptimized
              />
            ) : null}
          </div>
        </div>

        {/* Share Options */}
        {hasShareOptions && (
          <div className="mt-auto space-y-3">
            {/* Primary Share Buttons - grid on mobile, inline on desktop */}
            <div className="grid grid-cols-3 gap-2 lg:flex lg:justify-center lg:gap-3">
              {config.allowDownload && (
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={!resultUrl}
                  className="flex flex-col items-center justify-center p-3 rounded-lg bg-white/10 min-h-[60px] lg:min-h-0 lg:flex-row lg:gap-2 lg:px-4 lg:py-2 disabled:opacity-50"
                  style={{ borderRadius: buttonRadius }}
                  aria-label="Download image"
                >
                  <Download className="h-5 w-5 mb-1 lg:mb-0" />
                  <span className="text-xs">Download</span>
                </button>
              )}
              {config.allowSystemShare && (
                <button
                  type="button"
                  onClick={handleShare}
                  disabled={!resultUrl}
                  className="flex flex-col items-center justify-center p-3 rounded-lg bg-white/10 min-h-[60px] lg:min-h-0 lg:flex-row lg:gap-2 lg:px-4 lg:py-2 disabled:opacity-50"
                  style={{ borderRadius: buttonRadius }}
                  aria-label="Share image"
                >
                  <Share2 className="h-5 w-5 mb-1 lg:mb-0" />
                  <span className="text-xs">Share</span>
                </button>
              )}
              {config.allowEmail && (
                <button
                  type="button"
                  disabled
                  className="flex flex-col items-center justify-center p-3 rounded-lg bg-white/10 min-h-[60px] lg:min-h-0 lg:flex-row lg:gap-2 lg:px-4 lg:py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ borderRadius: buttonRadius }}
                  aria-label="Email image (coming soon)"
                >
                  <Mail className="h-5 w-5 mb-1 lg:mb-0" />
                  <span className="text-xs">Email</span>
                </button>
              )}
            </div>

            {/* Social Media Buttons */}
            {config.socials.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center">
                {config.socials.map((social) => (
                  <button
                    type="button"
                    key={social}
                    disabled
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: buttonBgColor,
                      color: buttonTextColor,
                      borderRadius: buttonRadius,
                    }}
                    aria-label={`Share to ${SOCIAL_LABELS[social]} (coming soon)`}
                  >
                    <span>{SOCIAL_ICONS[social]}</span>
                    <span>{SOCIAL_LABELS[social]}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </StepLayout>
  );
}
