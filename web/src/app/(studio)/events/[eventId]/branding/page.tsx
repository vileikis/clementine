import { getEventAction } from "@/features/events"
import { notFound } from "next/navigation"
import { BrandingForm } from "@/features/companies"

interface BrandingPageProps {
  params: Promise<{ eventId: string }>
}

export default async function BrandingPage({ params }: BrandingPageProps) {
  const { eventId } = await params
  const result = await getEventAction(eventId)

  if (!result.success || !result.event) {
    notFound()
  }

  const event = result.event

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Event Branding</h2>
        <p className="text-muted-foreground">
          Customize the appearance of your event to match your brand identity.
        </p>
      </div>

      <BrandingForm
        eventId={eventId}
        eventTitle={event.title}
        initialBrandColor={event.brandColor}
        initialShowTitleOverlay={event.showTitleOverlay}
      />
    </div>
  )
}
