import { getEventAction } from "@/app/actions/events"
import { notFound } from "next/navigation"
import { BrandThemeProvider } from "@/components/guest/BrandThemeProvider"
import { GuestFlowContainer } from "@/components/guest/GuestFlowContainer"

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
    <BrandThemeProvider brandColor={event.brandColor}>
      <GuestFlowContainer
        eventId={event.id}
        eventTitle={event.title}
        showTitleOverlay={event.showTitleOverlay}
      />
    </BrandThemeProvider>
  )
}
