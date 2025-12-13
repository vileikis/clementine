"use client";

import type { CSSProperties, ReactNode } from "react";
import type { ThemeBackground } from "../types";

interface ThemedBackgroundProps {
  /** Content to render above the background */
  children: ReactNode;
  /** Background configuration (color, image, overlay) */
  background?: Partial<ThemeBackground>;
  /** CSS font-family to apply to the container */
  fontFamily?: string | null;
  /** Additional CSS classes */
  className?: string;
  /** Additional inline styles for the container */
  style?: CSSProperties;
  /**
   * Content wrapper className. Set to empty string to disable the default wrapper.
   * Must include z-10 to stay above background image and overflow-auto for scrolling.
   * @default "relative z-10 h-full w-full overflow-auto"
   */
  contentClassName?: string;
}

/**
 * Renders a container with themed background color, optional image, and optional overlay.
 *
 * Consolidates duplicate background rendering code from:
 * - ThemeEditor preview
 * - EventThemeEditor preview
 * - DeviceFrame
 *
 * @example
 * ```tsx
 * <ThemedBackground
 *   background={theme.background}
 *   fontFamily={theme.fontFamily}
 *   className="min-h-screen"
 * >
 *   <PageContent />
 * </ThemedBackground>
 * ```
 */
export function ThemedBackground({
  children,
  background,
  fontFamily,
  className = "",
  style,
  contentClassName = "relative z-10 min-h-full w-full overflow-auto py-8",
}: ThemedBackgroundProps) {
  const bgColor = background?.color ?? "#FFFFFF";
  const bgImage = background?.image;
  const overlayOpacity = background?.overlayOpacity ?? 0;

  return (
    <div
      className={`relative overflow-hidden flex-1 ${className}`}
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

      {/* Content - wrap only if contentClassName is provided */}
      {contentClassName ? (
        <div className={contentClassName}>
          {/* Inner centering wrapper: min-h-full ensures it fills container,
              flex centering works when content fits, scrolls properly when it overflows */}
          <div className="min-h-full w-full max-w-[800px] mx-auto flex flex-col items-center justify-center">
            {children}
          </div>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
