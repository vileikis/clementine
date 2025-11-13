import { getEventAction } from "@/app/actions/events"
import { notFound } from "next/navigation"
import { EventBreadcrumb } from "@/components/organizer/EventBreadcrumb"
import { EventTabs } from "@/components/organizer/EventTabs"
import { EventStatusSwitcher } from "@/components/organizer/EventStatusSwitcher"
import { EditableEventName } from "@/components/organizer/EditableEventName"
import { CopyLinkButton } from "@/components/organizer/CopyLinkButton"

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
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Breadcrumb navigation */}
      <EventBreadcrumb eventName={event.title} />

      {/* Event header with name, status, and copy link button */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 mb-4">
          <EditableEventName eventId={event.id} currentTitle={event.title} />
          <div className="flex items-center gap-3">
            <CopyLinkButton joinPath={event.joinPath} />
            <EventStatusSwitcher eventId={event.id} currentStatus={event.status} />
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <EventTabs eventId={eventId} />

      {/* Page content */}
      {children}
    </div>
  )
}
