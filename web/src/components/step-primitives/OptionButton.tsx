"use client";

import { useEventTheme } from "@/features/theming";
import type { ReactNode } from "react";

interface OptionButtonProps {
  children: ReactNode;
  selected?: boolean;
  onClick?: () => void;
}

/**
 * Selection option button for multiple choice, yes/no, etc.
 * Shows selected state with theme primary color.
 * Uses fixed border radius (not theme button radius).
 */
export function OptionButton({
  children,
  selected = false,
  onClick,
}: OptionButtonProps) {
  const { theme } = useEventTheme();

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full px-4 py-3 text-base font-medium border-2 rounded-lg transition-colors min-h-[44px]"
      style={{
        borderColor: selected ? theme.primaryColor : theme.text.color + "40",
        backgroundColor: selected ? theme.primaryColor + "15" : "transparent",
        color: theme.text.color,
      }}
    >
      {children}
    </button>
  );
}
