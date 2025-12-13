"use client"

import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEventTheme } from "@/features/theming"

interface LoadingScreenProps {
  /** Optional message to display below spinner */
  message?: string
  /** Optional custom class name */
  className?: string
}

/**
 * Loading indicator for guest flow.
 * Displays a centered spinner with optional message.
 * Uses theme-aware styling to ensure visibility on any background.
 */
export function LoadingScreen({ message, className }: LoadingScreenProps) {
  const { theme } = useEventTheme()
  const textColor = theme.text.color

  return (
    <div
      className={cn(
        "flex min-h-screen flex-col items-center justify-center gap-4 p-4",
        className
      )}
    >
      <Loader2
        className="h-12 w-12 animate-spin"
        style={{ color: `${textColor}CC` }}
        aria-hidden="true"
      />
      {message && (
        <p
          className="text-base text-center"
          style={{ color: `${textColor}CC` }}
        >
          {message}
        </p>
      )}
      <span className="sr-only">Loading...</span>
    </div>
  )
}
