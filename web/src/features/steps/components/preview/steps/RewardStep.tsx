"use client";

/**
 * Preview: RewardStep
 *
 * Read-only preview for Reward step type.
 * Displays final result with sharing options (download, share, social).
 */

import {
  Download,
  Share2,
  Mail,
  Image as ImageIcon,
} from "lucide-react";
import { StepLayout, ActionButton } from "@/components/step-primitives";
import { useEventTheme } from "@/components/providers/EventThemeProvider";
import type { StepReward, ShareSocial } from "@/features/steps/types";

interface RewardStepProps {
  step: StepReward;
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

export function RewardStep({ step }: RewardStepProps) {
  const { buttonBgColor, buttonTextColor, buttonRadius } = useEventTheme();

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
    <StepLayout>
      <div className="flex-1 flex flex-col">
        {/* Title */}
        {step.title && (
          <h2 className="text-2xl font-bold mb-2">{step.title}</h2>
        )}

        {/* Description */}
        {step.description && (
          <p className="text-sm opacity-80 mb-4">{step.description}</p>
        )}

        {/* Result Image Placeholder */}
        <div className="flex-1 flex items-center justify-center py-4">
          <div
            className="w-full max-w-[200px] aspect-square rounded-lg border-2 border-dashed flex items-center justify-center"
            style={{ borderColor: `${buttonBgColor}40` }}
          >
            <div className="text-center opacity-60">
              <ImageIcon className="h-12 w-12 mx-auto mb-2" />
              <p className="text-xs">Generated result</p>
              <p className="text-xs">will appear here</p>
            </div>
          </div>
        </div>

        {/* Share Options */}
        {hasShareOptions && (
          <div className="mt-auto space-y-3">
            {/* Primary Share Buttons */}
            <div className="grid grid-cols-3 gap-2">
              {config.allowDownload && (
                <button
                  className="flex flex-col items-center justify-center p-3 rounded-lg bg-white/10 min-h-[60px]"
                  style={{ borderRadius: buttonRadius }}
                >
                  <Download className="h-5 w-5 mb-1" />
                  <span className="text-xs">Download</span>
                </button>
              )}
              {config.allowSystemShare && (
                <button
                  className="flex flex-col items-center justify-center p-3 rounded-lg bg-white/10 min-h-[60px]"
                  style={{ borderRadius: buttonRadius }}
                >
                  <Share2 className="h-5 w-5 mb-1" />
                  <span className="text-xs">Share</span>
                </button>
              )}
              {config.allowEmail && (
                <button
                  className="flex flex-col items-center justify-center p-3 rounded-lg bg-white/10 min-h-[60px]"
                  style={{ borderRadius: buttonRadius }}
                >
                  <Mail className="h-5 w-5 mb-1" />
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

        {/* CTA Button */}
        {step.ctaLabel && (
          <div className="mt-4">
            <ActionButton>{step.ctaLabel}</ActionButton>
          </div>
        )}
      </div>
    </StepLayout>
  );
}
