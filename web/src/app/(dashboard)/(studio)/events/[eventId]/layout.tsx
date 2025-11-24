import { getEventAction, EventBreadcrumb, EventTabs, EventStatusSwitcher } from "@/features/events"
import { notFound } from "next/navigation"
import { CopyLinkButton } from "@/features/distribution"

interface EventLayoutProps {
  children: React.ReactNode
  params: Promise<{ eventId: string }>
}

export default async function EventLayout({
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
            <EventBreadcrumb eventId={event.id} eventName={event.title} />

            {/* Vertical divider */}
            <div className="h-6 w-px bg-border" aria-hidden="true" />

            {/* Tabs (centered, flexible space) */}
            <div className="flex-1 flex justify-center">
              <EventTabs eventId={eventId} />
            </div>

            {/* Actions (right side) */}
            <div className="flex items-center gap-3 shrink-0">
              <CopyLinkButton joinPath={event.joinPath} />
              <EventStatusSwitcher eventId={event.id} currentStatus={event.status} />
            </div>
          </div>
        </div>
      </div>

      {/* Page content - child routes handle their own main wrapper */}
      {children}
    </div>
  )
}
