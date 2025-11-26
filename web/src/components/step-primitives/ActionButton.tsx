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
      className="w-full px-6 py-3 text-base font-medium transition-opacity disabled:opacity-50 min-h-[44px]"
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
