import { EventBreadcrumb, EventTabs, EventStatusSwitcher } from "@/features/events"
import { getEventAction } from "@/features/events/actions"
import { notFound } from "next/navigation"
import { CopyLinkButton } from "@/features/distribution"
import type { EventStatus } from "@/features/events/types/event.types"

interface EventLayoutProps {
  children: React.ReactNode
  params: Promise<{ eventId: string }>
}

/**
 * Studio Layout - Event management UI
 *
 * Shows event header with:
 * - Editable event name breadcrumb
 * - Main tabs (Design, Distribution, Results)
 * - Status switcher and actions
 *
 * Note: getEventAction is called again here, but Next.js automatically
 * deduplicates it with the parent layout's fetch (same render cycle)
 */
export default async function StudioLayout({
  children,
  params,
}: EventLayoutProps) {
  const { eventId } = await params
  const result = await getEventAction(eventId)

  if (!result.success || !result.event) {
    notFound()
  }

  const event = result.event

  return (
    <div className="min-h-screen bg-background">
      {/* Event navigation bar - everything on one row */}
      <div className="border-b bg-background sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-6">
            {/* Breadcrumb (includes editable event name) */}
            <EventBreadcrumb eventId={event.id} eventName={event.name} />

            {/* Vertical divider */}
            <div className="h-6 w-px bg-border" aria-hidden="true" />

            {/* Tabs (centered, flexible space) */}
            <div className="flex-1 flex justify-center">
              <EventTabs eventId={eventId} />
            </div>

            {/* Actions (right side) */}
            <div className="flex items-center gap-3 shrink-0">
              <CopyLinkButton joinPath={event.joinPath} />
              <EventStatusSwitcher eventId={event.id} currentStatus={event.status as Exclude<EventStatus, "deleted">} />
            </div>
          </div>
        </div>
      </div>

      {/* Page content - child routes handle their own main wrapper */}
      {children}
    </div>
  )
}
