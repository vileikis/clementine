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
 * Loading indicator for guest flow.
 * Displays a centered spinner with optional message.
 * Uses neutral styling that works with any theme background.
 *
 * Note: Parent ThemedBackground handles full-screen height and centering.
 * This component just provides the content.
 */
export function LoadingScreen({ message, className }: LoadingScreenProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 p-4",
        className
      )}
    >
      <Loader2
        className="h-12 w-12 animate-spin text-white/80"
        aria-hidden="true"
      />
      {message && (
        <p className="text-base text-white/80 text-center">{message}</p>
      )}
      <span className="sr-only">Loading...</span>
    </div>
  )
}
