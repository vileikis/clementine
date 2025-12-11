"use client"

import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingScreenProps {
  /** Optional message to display below spinner */
  message?: string
  /** Optional custom class name */
  className?: string
}

/**
 * Full-screen loading indicator for guest flow.
 * Displays a centered spinner with optional message.
 * Uses neutral styling that works with any theme background.
 */
export function LoadingScreen({ message, className }: LoadingScreenProps) {
  return (
    <div
      className={cn(
        "flex min-h-screen flex-col items-center justify-center gap-4 p-4",
        className
      )}
    >
      <Loader2
        className="h-8 w-8 animate-spin text-white/60"
        aria-hidden="true"
      />
      {message && (
        <p className="text-sm text-white/60 text-center">{message}</p>
      )}
      <span className="sr-only">Loading...</span>
    </div>
  )
}
