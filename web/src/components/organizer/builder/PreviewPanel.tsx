"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface PreviewPanelProps {
  title?: string;
  children: ReactNode;
  className?: string;
  /**
   * Mobile device frame aspect ratio (default: 9/19.5 for iPhone-like aspect)
   */
  aspectRatio?: number;
}

/**
 * PreviewPanel component provides a reusable preview container
 * Part of Phase 4 (User Story 1) - Content Tab Layout Infrastructure
 *
 * Features:
 * - Mobile device frame styling
 * - Responsive aspect ratio
 * - Scrollable content area
 * - Optional title
 */
export function PreviewPanel({
  title = "Preview",
  children,
  className,
  aspectRatio = 9 / 19.5,
}: PreviewPanelProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {title && (
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      )}
      <div
        className={cn(
          "relative bg-muted rounded-lg border-2 border-border overflow-hidden",
          "shadow-sm"
        )}
        style={{
          aspectRatio: aspectRatio.toString(),
          maxWidth: "375px",
          width: "100%",
        }}
      >
        <div className="absolute inset-0 overflow-y-auto bg-background">
          {children}
        </div>
      </div>
    </div>
  );
}
