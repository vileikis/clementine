"use client";

import Image from "next/image";
import { useEventTheme } from "@/components/providers/EventThemeProvider";
import { LottiePlayer } from "@/components/shared/LottiePlayer";
import { getMediaType } from "@/features/steps/utils";
import { ActionBar } from "./ActionBar";
import type { ReactNode } from "react";
import type { StepMediaType } from "@/features/steps/types";

interface StepLayoutProps {
  children: ReactNode;
  mediaUrl?: string | null;
  mediaType?: StepMediaType | null;
  /** Optional action slot (CTA buttons). Renders in ActionBar for responsive positioning. */
  action?: ReactNode;
}

/**
 * Responsive layout primitive for step content.
 *
 * Mobile (< 1024px):
 * - Full viewport height with scrollable content
 * - Fixed bottom action bar for CTA
 * - Full-width with 16px padding
 *
 * Desktop (>= 1024px):
 * - Centered container with max-width 640px
 * - Vertically centered content
 * - Inline CTA below content
 *
 * Supports: images, GIFs, videos, and Lottie animations for hero media.
 */
export function StepLayout({
  children,
  mediaUrl,
  mediaType,
  action,
}: StepLayoutProps) {
  const { theme } = useEventTheme();

  // Get effective media type (stored or inferred from URL)
  const effectiveMediaType = getMediaType(mediaType, mediaUrl);

  const renderMedia = () => {
    if (!mediaUrl || !effectiveMediaType) return null;

    switch (effectiveMediaType) {
      case "image":
        return (
          <Image
            src={mediaUrl}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 400px"
          />
        );
      case "gif":
        return (
          <Image
            src={mediaUrl}
            alt=""
            fill
            className="object-cover"
            unoptimized
            sizes="(max-width: 768px) 100vw, 400px"
          />
        );
      case "video":
        return (
          <video
            src={mediaUrl}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />
        );
      case "lottie":
        return (
          <LottiePlayer
            url={mediaUrl}
            className="absolute inset-0 h-full w-full"
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="flex h-full flex-col lg:items-center lg:justify-center"
      style={{
        color: theme.text.color,
        textAlign: theme.text.alignment,
      }}
    >
      {/* Content container: full width on mobile, constrained on desktop */}
      <div className="flex flex-1 flex-col w-full lg:flex-none lg:max-w-xl lg:w-full">
        {/* Scrollable content area on mobile */}
        <div className="flex-1 overflow-y-auto lg:overflow-visible px-4 lg:px-6 pb-24 lg:pb-0">
          {mediaUrl && (
            <div className="relative w-full max-w-sm mx-auto aspect-video overflow-hidden rounded-lg mb-4">
              {renderMedia()}
            </div>
          )}
          {children}
        </div>

        {/* Action bar: fixed on mobile, inline on desktop */}
        {action && <ActionBar>{action}</ActionBar>}
      </div>
    </div>
  );
}
