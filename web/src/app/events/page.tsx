import Link from "next/link"
import { listEventsAction } from "@/app/actions/events"
import { EventCard } from "@/components/organizer/EventCard"

export default async function EventsPage() {
  const result = await listEventsAction()

  if (!result.success) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Failed to load events: {result.error}</p>
      </div>
    )
  }

  const events = result.events ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Events</h2>
          <p className="text-muted-foreground mt-1">
            Create and manage your AI photobooth experiences
          </p>
        </div>
        <Link
          href="/events/new"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Create Event
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12 border rounded-lg border-dashed">
          <h3 className="text-lg font-semibold mb-2">No events yet</h3>
          <p className="text-muted-foreground mb-4">
            Get started by creating your first AI photobooth event
          </p>
          <Link
            href="/events/new"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Create Your First Event
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  )
}
