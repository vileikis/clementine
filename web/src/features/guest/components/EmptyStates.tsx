"use client"

import { Calendar, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  /** Optional custom class name */
  className?: string
}

/**
 * Empty state shown when project has no active event.
 * Displayed when project.activeEventId is null or event doesn't exist.
 *
 * Note: Parent ThemedBackground handles full-screen height and centering.
 * This component just provides the content.
 */
export function NoActiveEvent({ className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 p-8 text-center",
        className
      )}
    >
      <div className="rounded-full bg-white/10 p-4">
        <Calendar className="h-8 w-8 text-white/60" aria-hidden="true" />
      </div>
      <div className="max-w-xs space-y-2">
        <h1 className="text-xl font-semibold text-white">
          Event Not Available
        </h1>
        <p className="text-sm text-white/60">
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
 *
 * Note: Parent ThemedBackground handles full-screen height and centering.
 * This component just provides the content.
 */
export function EmptyEvent({ className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 p-8 text-center",
        className
      )}
    >
      <div className="rounded-full bg-white/10 p-4">
        <Sparkles className="h-8 w-8 text-white/60" aria-hidden="true" />
      </div>
      <div className="max-w-xs space-y-2">
        <h1 className="text-xl font-semibold text-white">
          Coming Soon
        </h1>
        <p className="text-sm text-white/60">
          This event is being set up. Experiences will be available soon.
        </p>
      </div>
    </div>
  )
}
