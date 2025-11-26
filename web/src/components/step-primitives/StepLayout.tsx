"use client";

import Image from "next/image";
import { useEventTheme } from "@/components/providers/EventThemeProvider";
import type { ReactNode } from "react";

interface StepLayoutProps {
  children: ReactNode;
  mediaUrl?: string | null;
}

/**
 * Layout primitive for step content with optional hero media.
 * Applies theme text styling and provides consistent spacing.
 */
export function StepLayout({ children, mediaUrl }: StepLayoutProps) {
  const { theme } = useEventTheme();

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
          <Image
            src={mediaUrl}
            alt=""
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      )}
      <div className="flex flex-1 flex-col justify-between p-4">
        {children}
      </div>
    </div>
  );
}
