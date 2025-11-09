import { getEventAction } from "@/app/actions/events"
import { notFound } from "next/navigation"
import { QRPanel } from "@/components/organizer/QRPanel"
import { getJoinUrl } from "@/lib/utils/urls"

interface DistributionPageProps {
  params: Promise<{ eventId: string }>
}

export default async function DistributionPage({
  params,
}: DistributionPageProps) {
  const { eventId } = await params
  const result = await getEventAction(eventId)

  if (!result.success || !result.event) {
    notFound()
  }

  const event = result.event

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Distribution</h2>
        <p className="text-muted-foreground">
          Share your event with guests using the join URL or QR code.
        </p>
      </div>

      <QRPanel
        eventId={event.id}
        joinUrl={getJoinUrl(event.joinPath)}
        qrPngPath={event.qrPngPath}
      />
    </div>
  )
}
