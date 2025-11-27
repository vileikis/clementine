"use client";

import Image from "next/image";
import { useEventTheme } from "@/components/providers/EventThemeProvider";
import { LottiePlayer } from "@/components/shared/LottiePlayer";
import { useViewportMode } from "@/features/steps/components/preview";
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
  const viewportMode = useViewportMode();
  const isMobile = viewportMode === "mobile";

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
      className={`relative h-full ${!isMobile ? "flex items-center justify-center" : ""}`}
      style={{
        color: theme.text.color,
        textAlign: theme.text.alignment,
      }}
    >
      {/* Content container: full width on mobile, constrained on desktop */}
      <div
        className={
          isMobile
            ? "h-full w-full overflow-y-auto px-4 pb-24 pt-8"
            : "h-auto max-w-xl w-full overflow-visible px-6"
        }
      >
        {mediaUrl && (
          <div className="relative w-full max-w-sm mx-auto aspect-video overflow-hidden rounded-lg mb-4">
            {renderMedia()}
          </div>
        )}
        {children}

        {/* Desktop: action inline after content */}
        {action && !isMobile && <div className="pt-4">{action}</div>}
      </div>

      {/* Mobile: action bar fixed at bottom */}
      {action && isMobile && <ActionBar>{action}</ActionBar>}
    </div>
  );
}
