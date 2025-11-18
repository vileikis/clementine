import { getEventAction } from "@/lib/actions/events"
import { getCompanyStatus } from "@/features/companies/lib/repository"
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

  // Check if event has a company and if that company is deleted
  if (event.companyId) {
    const companyStatus = await getCompanyStatus(event.companyId)

    if (!companyStatus || companyStatus === "deleted") {
      return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-background">
          <div className="max-w-md text-center space-y-4">
            <h1 className="text-2xl md:text-3xl font-bold">Event Unavailable</h1>
            <p className="text-base md:text-lg text-muted-foreground">
              This event is no longer available. Please contact the event organizer for more information.
            </p>
          </div>
        </div>
      )
    }
  }

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
