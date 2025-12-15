"use client";

import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { ThemeBackground } from "../types";

interface ThemedBackgroundProps {
  /** Content to render above the background */
  children: ReactNode;
  /** Background configuration (color, image, overlay) */
  background?: Partial<ThemeBackground>;
  /** CSS font-family to apply to the container */
  fontFamily?: string | null;
  /** Additional CSS classes for the outer container */
  className?: string;
  /** Additional inline styles for the outer container */
  style?: CSSProperties;
  /**
   * Override classes for the content wrapper.
   * Default provides centered, max-width content with vertical centering.
   * Pass empty string to disable content wrapper entirely.
   */
  contentClassName?: string;
}

/**
 * Renders a full-height container with themed background and centered content.
 *
 * Default behavior:
 * - Outer container: fills available space (flex-1), flex column
 * - Content: max-width 768px, horizontally centered, vertically centered, scrollable
 *
 * Use `contentClassName` to override content wrapper behavior, or pass empty string
 * to render children directly without a wrapper.
 *
 * @example
 * ```tsx
 * // Standard usage - centered content with max-width
 * <ThemedBackground background={theme.background} fontFamily={theme.fontFamily}>
 *   <PageContent />
 * </ThemedBackground>
 *
 * // Custom content layout
 * <ThemedBackground contentClassName="p-4">
 *   <FullWidthContent />
 * </ThemedBackground>
 *
 * // No content wrapper
 * <ThemedBackground contentClassName="">
 *   <CustomLayout />
 * </ThemedBackground>
 * ```
 */
export function ThemedBackground({
  children,
  background,
  fontFamily,
  className,
  style,
  contentClassName,
}: ThemedBackgroundProps) {
  const bgColor = background?.color ?? "#FFFFFF";
  const bgImage = background?.image;
  const overlayOpacity = background?.overlayOpacity ?? 0;

  // Check if content wrapper should be rendered
  const hasContentWrapper = contentClassName !== "";

  return (
    <div
      className={cn("relative flex flex-1 flex-col overflow-hidden", className)}
      style={{
        backgroundColor: bgColor,
        fontFamily: fontFamily ?? undefined,
        ...style,
      }}
    >
      {/* Background Image */}
      {bgImage && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
      )}

      {/* Overlay for readability when image is present */}
      {bgImage && overlayOpacity > 0 && (
        <div
          className="absolute inset-0 bg-black pointer-events-none"
          style={{ opacity: overlayOpacity }}
        />
      )}

      {/* Content wrapper with sensible defaults */}
      {hasContentWrapper ? (
        <div
          className={cn(
            "relative z-10 flex flex-1 flex-col items-center justify-center overflow-auto px-4 py-8",
            contentClassName
          )}
        >
          <div className="w-full max-w-3xl">{children}</div>
        </div>
      ) : (
        <div className="relative z-10 flex flex-1 flex-col">{children}</div>
      )}
    </div>
  );
}
