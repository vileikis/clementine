"use client"

import { Calendar, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEventTheme } from "@/features/theming"

interface EmptyStateProps {
  /** Optional custom class name */
  className?: string
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
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center",
        className
      )}
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
        <h1
          className="text-xl font-semibold"
          style={{ color: textColor }}
        >
          Event Not Available
        </h1>
        <p
          className="text-sm"
          style={{ color: `${textColor}99` }}
        >
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
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center",
        className
      )}
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
        <h1
          className="text-xl font-semibold"
          style={{ color: textColor }}
        >
          Coming Soon
        </h1>
        <p
          className="text-sm"
          style={{ color: `${textColor}99` }}
        >
          This event is being set up. Experiences will be available soon.
        </p>
      </div>
    </div>
  )
}
