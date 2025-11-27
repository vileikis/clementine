import { getEventAction } from "@/features/events/actions"
import { getCompanyStatus } from "@/features/companies/repositories/companies.repository"
import {
  getJourneyForGuestAction,
  getExperiencesForGuestAction,
} from "@/features/sessions/actions"
import { notFound } from "next/navigation"
import {
  BrandThemeProvider,
  GuestFlowContainer,
  JourneyGuestContainer,
} from "@/features/guest"

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

  // Check if event has an owner company and if that company is deleted
  if (event.ownerId) {
    const companyStatus = await getCompanyStatus(event.ownerId)

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

  // Route based on activeJourneyId - new journey flow vs legacy flow
  if (event.activeJourneyId) {
    // Load journey and steps
    const journeyResult = await getJourneyForGuestAction(
      event.id,
      event.activeJourneyId
    )

    // Load experiences for experience-picker steps
    const experiencesResult = await getExperiencesForGuestAction(event.id)

    // Validate journey exists and has steps
    if (
      journeyResult.success &&
      journeyResult.journey &&
      journeyResult.steps.length > 0 &&
      experiencesResult.success
    ) {
      return (
        <JourneyGuestContainer
          event={event}
          journey={journeyResult.journey}
          steps={journeyResult.steps}
          experiences={experiencesResult.experiences}
        />
      )
    }

    // Journey not found or has no steps - show error
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-background">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl md:text-3xl font-bold">Journey Unavailable</h1>
          <p className="text-base md:text-lg text-muted-foreground">
            This journey is not configured. Please contact the event organizer.
          </p>
        </div>
      </div>
    )
  }

  // Fallback to legacy flow when no activeJourneyId
  return (
    <BrandThemeProvider brandColor={event.theme.primaryColor}>
      <GuestFlowContainer
        eventId={event.id}
        eventTitle={event.name}
      />
    </BrandThemeProvider>
  )
}
