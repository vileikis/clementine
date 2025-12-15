"use client"

import { Calendar, Sparkles, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEventTheme } from "@/features/theming"

interface EmptyStateProps {
  /** Optional custom class name */
  className?: string
}

interface ErrorScreenProps extends EmptyStateProps {
  /** Error message to display */
  message?: string
  /** Callback when retry button is clicked */
  onRetry?: () => void
}

/**
 * Empty state shown when project has no active event.
 * Displayed when project.activeEventId is null or event doesn't exist.
 */
export function NoActiveEvent({ className }: EmptyStateProps) {
  const { theme } = useEventTheme()
  const textColor = theme.text.color

  return (
    <div
      className={cn("flex flex-col items-center gap-4 text-center", className)}
    >
      <div
        className="rounded-full p-4"
        style={{ backgroundColor: `${textColor}10` }}
      >
        <Calendar
          className="h-8 w-8"
          style={{ color: `${textColor}99` }}
          aria-hidden="true"
        />
      </div>
      <div className="max-w-xs space-y-2">
        <h1 className="text-xl font-semibold" style={{ color: textColor }}>
          Event Not Available
        </h1>
        <p className="text-sm" style={{ color: `${textColor}99` }}>
          This event has not been launched yet. Please check back later or
          contact the event organizer.
        </p>
      </div>
    </div>
  )
}

/**
 * Empty state shown when event exists but has no enabled experiences.
 * Displayed when event.experiences is empty or all experiences are disabled.
 */
export function EmptyEvent({ className }: EmptyStateProps) {
  const { theme } = useEventTheme()
  const textColor = theme.text.color

  return (
    <div
      className={cn("flex flex-col items-center gap-4 text-center", className)}
    >
      <div
        className="rounded-full p-4"
        style={{ backgroundColor: `${textColor}10` }}
      >
        <Sparkles
          className="h-8 w-8"
          style={{ color: `${textColor}99` }}
          aria-hidden="true"
        />
      </div>
      <div className="max-w-xs space-y-2">
        <h1 className="text-xl font-semibold" style={{ color: textColor }}>
          Coming Soon
        </h1>
        <p className="text-sm" style={{ color: `${textColor}99` }}>
          This event is being set up. Experiences will be available soon.
        </p>
      </div>
    </div>
  )
}

/**
 * Error state shown when session initialization fails.
 * Displays error message with retry button that reloads the page.
 */
export function ErrorScreen({
  className,
  message = "Something went wrong",
  onRetry,
}: ErrorScreenProps) {
  const { theme } = useEventTheme()
  const textColor = theme.text.color

  const handleRetry = () => {
    if (onRetry) {
      onRetry()
    } else {
      window.location.reload()
    }
  }

  return (
    <div
      className={cn(
        "flex h-full flex-col items-center justify-center gap-4 text-center p-4",
        className
      )}
    >
      <div
        className="rounded-full p-4"
        style={{ backgroundColor: `${textColor}10` }}
      >
        <AlertCircle
          className="h-8 w-8"
          style={{ color: `${textColor}99` }}
          aria-hidden="true"
        />
      </div>
      <div className="max-w-xs space-y-2">
        <h1 className="text-xl font-semibold" style={{ color: textColor }}>
          Oops!
        </h1>
        <p className="text-sm" style={{ color: `${textColor}99` }}>
          {message}
        </p>
      </div>
      <button
        onClick={handleRetry}
        className="mt-2 rounded-lg px-6 py-2 font-medium transition-opacity hover:opacity-80"
        style={{
          backgroundColor: theme.button.backgroundColor ?? theme.primaryColor,
          color: theme.button.textColor,
        }}
      >
        Try Again
      </button>
    </div>
  )
}
