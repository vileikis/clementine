"use client";

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
        <div className="w-full aspect-video overflow-hidden">
          <img
            src={mediaUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col justify-between p-4">
        {children}
      </div>
    </div>
  );
}
