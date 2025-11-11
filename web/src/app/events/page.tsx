import Link from "next/link"
import { listEventsAction } from "@/app/actions/events"
import { getCompanyAction } from "@/app/actions/companies"
import { EventCard } from "@/components/organizer/EventCard"
import { LogoutButton } from "@/components/organizer/LogoutButton"

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

  // Fetch company names for events that have companyId
  const companyIds = [...new Set(events.filter(e => e.companyId).map(e => e.companyId!))]
  const companies = await Promise.all(
    companyIds.map(async (id) => {
      const result = await getCompanyAction(id)
      return result.success ? result.company : null
    })
  )
  const companyMap = new Map(companies.filter(c => c).map(c => [c!.id, c!.name]))

  // Create events with company names
  const eventsWithCompanies = events.map(event => ({
    event,
    companyName: event.companyId ? companyMap.get(event.companyId) ?? null : null
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Events</h2>
          <p className="text-muted-foreground mt-1">
            Create and manage your AI photobooth experiences
          </p>
        </div>
        <div className="flex items-center gap-3">
          <LogoutButton />
          <Link
            href="/events/new"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Create Event
          </Link>
        </div>
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
          {eventsWithCompanies.map(({ event, companyName }) => (
            <EventCard key={event.id} event={event} companyName={companyName} />
          ))}
        </div>
      )}
    </div>
  )
}
