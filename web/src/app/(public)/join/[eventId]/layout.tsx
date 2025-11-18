import { getEventAction } from "@/lib/actions/events"
import { notFound } from "next/navigation"

interface JoinLayoutProps {
  children: React.ReactNode
  params: Promise<{ eventId: string }>
}

export default async function JoinLayout({
  children,
  params,
}: JoinLayoutProps) {
  const { eventId } = await params
  const result = await getEventAction(eventId)

  if (!result.success || !result.event) {
    notFound()
  }

  const event = result.event

  // Validate event is live
  if (event.status !== "live") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Event Not Available</h1>
          <p className="text-muted-foreground mb-6">
            {event.status === "draft"
              ? "This event is not yet live. Please check back later."
              : "This event has been archived and is no longer accepting guests."}
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
