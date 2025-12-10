"use client";

import { useEventTheme } from "@/features/theming";
import type { ChangeEvent } from "react";

interface TextInputProps {
  value?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  maxLength?: number;
  type?: "text" | "email";
  required?: boolean;
}

/**
 * Single-line text input styled with event theme.
 * Used for short text and email inputs.
 * Uses fixed border radius (not theme button radius).
 */
export function TextInput({
  value = "",
  placeholder = "",
  onChange,
  maxLength,
  type = "text",
  required = false,
}: TextInputProps) {
  const { theme } = useEventTheme();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
  };

  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={handleChange}
      maxLength={maxLength}
      required={required}
      className="w-full px-4 py-3 text-base border-2 rounded-lg bg-transparent outline-none transition-colors min-h-[44px] focus:border-current"
      style={{
        borderColor: theme.text.color + "40",
        color: theme.text.color,
      }}
    />
  );
}
