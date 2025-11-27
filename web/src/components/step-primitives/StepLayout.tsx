"use client";

import Image from "next/image";
import { useEventTheme } from "@/components/providers/EventThemeProvider";
import { LottiePlayer } from "@/components/shared/LottiePlayer";
import { getMediaType } from "@/features/steps/utils";
import type { ReactNode } from "react";
import type { StepMediaType } from "@/features/steps/types";

interface StepLayoutProps {
  children: ReactNode;
  mediaUrl?: string | null;
  mediaType?: StepMediaType | null;
}

/**
 * Layout primitive for step content with optional hero media.
 * Applies theme text styling and provides consistent spacing.
 * Supports: images, GIFs, videos, and Lottie animations.
 */
export function StepLayout({ children, mediaUrl, mediaType }: StepLayoutProps) {
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
      className="flex h-full flex-col"
      style={{
        color: theme.text.color,
        textAlign: theme.text.alignment,
      }}
    >
      {mediaUrl && (
        <div className="relative w-full aspect-video overflow-hidden">
          {renderMedia()}
        </div>
      )}
      <div className="flex flex-1 flex-col justify-between p-4">
        {children}
      </div>
    </div>
  );
}
