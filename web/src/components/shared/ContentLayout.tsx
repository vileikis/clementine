"use client"

import { cn } from "@/lib/utils"
import type { ReactNode, CSSProperties } from "react"

type VerticalAlign = "top" | "center" | "bottom" | "stretch"
type HorizontalAlign = "left" | "center" | "right" | "stretch"

interface ContentLayoutProps {
  children: ReactNode
  /** Vertical alignment of content. Default: "center" */
  vAlign?: VerticalAlign
  /** Horizontal alignment of content. Default: "center" */
  hAlign?: HorizontalAlign
  /** Additional CSS classes */
  className?: string
  /** Additional inline styles */
  style?: CSSProperties
}

const vAlignMap: Record<VerticalAlign, string> = {
  top: "justify-start",
  center: "justify-center",
  bottom: "justify-end",
  stretch: "justify-stretch",
}

const hAlignMap: Record<HorizontalAlign, string> = {
  left: "items-start",
  center: "items-center",
  right: "items-end",
  stretch: "items-stretch",
}

/**
 * Shared layout component for consistent content alignment across guest screens.
 *
 * Provides a full-height flex container with configurable vertical and horizontal alignment.
 * Use this to ensure consistent centering between preview shell and guest flow.
 *
 * @example
 * ```tsx
 * <ContentLayout vAlign="center" hAlign="center">
 *   <WelcomeContent />
 * </ContentLayout>
 * ```
 */
export function ContentLayout({
  children,
  vAlign = "center",
  hAlign = "center",
  className,
  style,
}: ContentLayoutProps) {
  return (
    <div
      className={cn(
        "flex min-h-screen w-full flex-col",
        vAlignMap[vAlign],
        hAlignMap[hAlign],
        className
      )}
      style={style}
    >
      {children}
    </div>
  )
}
