"use client";

import { useEventTheme } from "@/components/providers/EventThemeProvider";
import { useViewportMode } from "@/features/steps/components/preview";
import type { ReactNode } from "react";

interface ActionButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}

/**
 * Primary action button styled with event theme.
 * Used for "Continue", "Submit", etc.
 *
 * Responsive sizing:
 * - Mobile: Full width, larger padding (py-4) for touch target
 * - Desktop: Auto width with min-width, smaller padding (py-3)
 */
export function ActionButton({
  children,
  onClick,
  disabled = false,
  type = "button",
}: ActionButtonProps) {
  const { buttonBgColor, buttonTextColor, buttonRadius } = useEventTheme();
  const viewportMode = useViewportMode();
  const isMobile = viewportMode === "mobile";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={
        isMobile
          ? "w-full px-6 py-4 text-base font-medium transition-opacity disabled:opacity-50 min-h-[44px]"
          : "w-auto min-w-[200px] px-6 py-3 text-base font-medium transition-opacity disabled:opacity-50 min-h-[44px]"
      }
      style={{
        backgroundColor: buttonBgColor,
        color: buttonTextColor,
        borderRadius: buttonRadius,
      }}
    >
      {children}
    </button>
  );
}
