"use client";

import { useEventTheme } from "@/components/providers/EventThemeProvider";
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

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="w-full px-6 py-4 text-base font-medium transition-opacity disabled:opacity-50 min-h-[44px] lg:w-auto lg:min-w-[200px] lg:py-3"
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
