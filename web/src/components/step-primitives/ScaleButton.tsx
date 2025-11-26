"use client";

import { useEventTheme } from "@/components/providers/EventThemeProvider";

interface ScaleButtonProps {
  value: number;
  selected?: boolean;
  onClick?: () => void;
}

/**
 * Numeric scale button for opinion scale steps.
 * Compact square button showing the numeric value.
 */
export function ScaleButton({
  value,
  selected = false,
  onClick,
}: ScaleButtonProps) {
  const { theme } = useEventTheme();

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-11 w-11 items-center justify-center text-base font-medium border-2 rounded-lg transition-colors"
      style={{
        borderColor: selected ? theme.primaryColor : theme.text.color + "40",
        backgroundColor: selected ? theme.primaryColor : "transparent",
        color: selected ? theme.button.textColor : theme.text.color,
      }}
    >
      {value}
    </button>
  );
}
