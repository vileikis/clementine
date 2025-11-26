"use client";

import { useEventTheme } from "@/components/providers/EventThemeProvider";
import type { ChangeEvent } from "react";

interface TextAreaProps {
  value?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  maxLength?: number;
  rows?: number;
  required?: boolean;
}

/**
 * Multi-line text area styled with event theme.
 * Used for long text input steps.
 * Uses fixed border radius (not theme button radius).
 */
export function TextArea({
  value = "",
  placeholder = "",
  onChange,
  maxLength,
  rows = 4,
  required = false,
}: TextAreaProps) {
  const { theme } = useEventTheme();

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange?.(e.target.value);
  };

  return (
    <textarea
      value={value}
      placeholder={placeholder}
      onChange={handleChange}
      maxLength={maxLength}
      rows={rows}
      required={required}
      className="w-full resize-none px-4 py-3 text-base border-2 rounded-lg bg-transparent outline-none transition-colors focus:border-current"
      style={{
        borderColor: theme.text.color + "40",
        color: theme.text.color,
      }}
    />
  );
}
