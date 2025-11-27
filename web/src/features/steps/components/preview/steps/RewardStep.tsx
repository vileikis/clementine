"use client";

/**
 * Preview: RewardStep
 *
 * Read-only preview for Reward step type.
 * Displays final result with sharing options (download, share, social).
 * Uses transformed placeholder from mockSession for realistic preview.
 *
 * Responsive sizing:
 * - Mobile: 70% width image, 3-column share grid
 * - Desktop: 50% width image (max 300px), inline share buttons
 */

import Image from "next/image";
import {
  Download,
  Share2,
  Mail,
} from "lucide-react";
import { StepLayout, ActionButton } from "@/components/step-primitives";
import { useEventTheme } from "@/components/providers/EventThemeProvider";
import type { StepReward, ShareSocial } from "@/features/steps/types";
import type { MockSessionData } from "@/features/steps/types/preview.types";

interface RewardStepProps {
  step: StepReward;
  mockSession?: MockSessionData;
}

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

export function RewardStep({ step, mockSession }: RewardStepProps) {
  const { buttonBgColor, buttonTextColor, buttonRadius } = useEventTheme();
  const transformedPhoto = mockSession?.transformedPhoto ?? "/placeholders/transformed-placeholder.svg";

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

  return (
    <StepLayout
      mediaUrl={step.mediaUrl}
      mediaType={step.mediaType}
      action={step.ctaLabel && <ActionButton>{step.ctaLabel}</ActionButton>}
    >
      <div className="flex-1 flex flex-col">
        {/* Title */}
        {step.title && (
          <h2 className="text-2xl font-bold mb-2">{step.title}</h2>
        )}

        {/* Description */}
        {step.description && (
          <p className="text-sm opacity-80 mb-4">{step.description}</p>
        )}

        {/* Result Image - responsive sizing */}
        <div className="flex-1 flex items-center justify-center py-4">
          <div
            className="w-[70%] lg:w-[50%] lg:max-w-[300px] aspect-[3/4] rounded-lg overflow-hidden relative shadow-lg"
          >
            <Image
              src={transformedPhoto}
              alt="AI transformed result"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        </div>

        {/* Share Options */}
        {hasShareOptions && (
          <div className="mt-auto space-y-3">
            {/* Primary Share Buttons - grid on mobile, inline on desktop */}
            <div className="grid grid-cols-3 gap-2 lg:flex lg:justify-center lg:gap-3">
              {config.allowDownload && (
                <button
                  className="flex flex-col items-center justify-center p-3 rounded-lg bg-white/10 min-h-[60px] lg:min-h-0 lg:flex-row lg:gap-2 lg:px-4 lg:py-2"
                  style={{ borderRadius: buttonRadius }}
                >
                  <Download className="h-5 w-5 mb-1 lg:mb-0" />
                  <span className="text-xs">Download</span>
                </button>
              )}
              {config.allowSystemShare && (
                <button
                  className="flex flex-col items-center justify-center p-3 rounded-lg bg-white/10 min-h-[60px] lg:min-h-0 lg:flex-row lg:gap-2 lg:px-4 lg:py-2"
                  style={{ borderRadius: buttonRadius }}
                >
                  <Share2 className="h-5 w-5 mb-1 lg:mb-0" />
                  <span className="text-xs">Share</span>
                </button>
              )}
              {config.allowEmail && (
                <button
                  className="flex flex-col items-center justify-center p-3 rounded-lg bg-white/10 min-h-[60px] lg:min-h-0 lg:flex-row lg:gap-2 lg:px-4 lg:py-2"
                  style={{ borderRadius: buttonRadius }}
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
                    key={social}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
                    style={{
                      backgroundColor: buttonBgColor,
                      color: buttonTextColor,
                      borderRadius: buttonRadius,
                    }}
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
