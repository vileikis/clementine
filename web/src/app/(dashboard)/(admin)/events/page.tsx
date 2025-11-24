import Link from "next/link"
import { listEventsAction, EventCard } from "@/features/events"
import { listCompaniesAction } from "@/features/companies/actions"
import { CompanyFilter } from "@/features/companies"

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ companyId?: string }>
}) {
  const params = await searchParams
  const companyIdFilter = params.companyId === "no-company"
    ? null
    : params.companyId || undefined

  const result = await listEventsAction(
    companyIdFilter !== undefined ? { companyId: companyIdFilter } : undefined
  )

  if (!result.success) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Failed to load events: {result.error?.message || "Unknown error"}</p>
      </div>
    )
  }

  const events = result.events ?? []

  // Fetch all active companies (used for both filter and event company names)
  const companiesResult = await listCompaniesAction()
  const allCompanies = companiesResult.success ? companiesResult.companies ?? [] : []

  // Create a Set of active company IDs for efficient filtering
  const activeCompanyIds = new Set(allCompanies.map(c => c.id))

  // Create company map for name lookup
  const companyMap = new Map(allCompanies.map(c => [c.id, c.name]))

  // Filter out events from deleted companies and add company names
  const eventsWithCompanies = events
    .filter(event => {
      // Include events with no company
      if (!event.companyId) return true

      // Include only if company is in active list (excludes deleted companies)
      return activeCompanyIds.has(event.companyId)
    })
    .map(event => ({
      event,
      companyName: event.companyId ? companyMap.get(event.companyId) ?? null : null
    }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">Events</h2>
          <p className="text-muted-foreground mt-1">
            Create and manage your AI photobooth experiences
          </p>
        </div>
        <Link
          href="/events/new"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors min-h-[44px]"
        >
          Create Event
        </Link>
      </div>

      {/* Company filter */}
      <CompanyFilter companies={allCompanies} />

      {eventsWithCompanies.length === 0 ? (
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
