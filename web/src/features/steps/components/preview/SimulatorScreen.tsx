"use client";

/**
 * Component: SimulatorScreen
 *
 * A theme-aware wrapper that simulates a mobile device screen.
 * Applies event theme (background, overlay, text color) to provide
 * an accurate preview of how steps will appear to guests.
 *
 * Used in the journey editor's middle panel.
 */

import { useEventTheme } from "@/components/providers/EventThemeProvider";
import type { ReactNode } from "react";

interface SimulatorScreenProps {
  children: ReactNode;
}

/**
 * Renders a mobile device frame with event theme applied.
 * All step preview components should be rendered inside this wrapper.
 */
export function SimulatorScreen({ children }: SimulatorScreenProps) {
  const { theme } = useEventTheme();

  return (
    <div
      className="w-full max-w-[320px] aspect-[9/16] rounded-2xl border-4 border-foreground/10 shadow-lg overflow-hidden relative"
      style={{
        backgroundColor: theme.background.color,
        fontFamily: theme.fontFamily || undefined,
      }}
    >
      {/* Background Image with Overlay */}
      {theme.background.image && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${theme.background.image})` }}
          />
          {theme.background.overlayOpacity > 0 && (
            <div
              className="absolute inset-0 bg-black pointer-events-none"
              style={{ opacity: theme.background.overlayOpacity }}
            />
          )}
        </>
      )}

      {/* Logo */}
      {theme.logoUrl && (
        <div className="absolute top-4 left-0 right-0 z-20 px-4">
          <div
            style={{
              textAlign: theme.text.alignment,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={theme.logoUrl}
              alt="Event logo"
              className="h-8 w-auto object-contain inline-block"
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 h-full pt-16">{children}</div>
    </div>
  );
}
