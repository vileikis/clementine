"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface PreviewPanelProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

/**
 * PreviewPanel component provides a reusable preview container
 * Part of Phase 4 (User Story 1) - Design Tab Layout Infrastructure
 * Updated in Phase 6 (User Story 4) - Rename Content to Design
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
}: PreviewPanelProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {title && (
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      )}
      <div
        className={cn(
          "relative bg-muted rounded-lg border-2 border-border overflow-hidden",
          "shadow-sm w-full h-[70vh] max-h-[700px]"
        )}
      >
        <div className="absolute inset-0 overflow-y-auto bg-background">
          {children}
        </div>
      </div>
    </div>
  );
}
