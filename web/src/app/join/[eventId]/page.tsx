import { getEventAction } from "@/app/actions/events"
import { notFound } from "next/navigation"

interface JoinPageProps {
  params: Promise<{ eventId: string }>
}

export default async function JoinPage({ params }: JoinPageProps) {
  const { eventId } = await params
  const result = await getEventAction(eventId)

  if (!result.success || !result.event) {
    notFound()
  }

  const event = result.event

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-3xl font-bold mb-4">{event.title}</h1>
        <div
          className="inline-block w-16 h-16 rounded-full mb-6"
          style={{ backgroundColor: event.brandColor }}
        />
        <p className="text-muted-foreground mb-8">
          Guest flow coming soon...
        </p>
        <div className="text-sm text-muted-foreground space-y-2">
          <p>Event ID: {event.id}</p>
          <p>Status: {event.status}</p>
          <p>Brand Color: {event.brandColor}</p>
        </div>
      </div>
    </div>
  )
}
