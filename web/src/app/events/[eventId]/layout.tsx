import Link from "next/link"
import { getEventAction } from "@/app/actions/events"
import { notFound } from "next/navigation"
import { TabLink } from "@/components/organizer/TabLink"

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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/events"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to Events
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
        <p className="text-sm text-muted-foreground">
          Status: <span className="capitalize">{event.status}</span> • Brand:{" "}
          <span
            className="inline-block w-3 h-3 rounded align-middle"
            style={{ backgroundColor: event.brandColor }}
          />{" "}
          {event.brandColor}
        </p>
      </div>

      <nav className="border-b mb-8">
        <ul className="flex gap-8">
          <TabLink href={`/events/${eventId}/scene`}>Scene</TabLink>
          <TabLink href={`/events/${eventId}/branding`}>Branding</TabLink>
          <TabLink href={`/events/${eventId}/distribution`}>
            Distribution
          </TabLink>
        </ul>
      </nav>

      {children}
    </div>
  )
}
