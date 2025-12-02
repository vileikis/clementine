import { getProjectAction } from "@/features/projects/actions"
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
  EventUnavailableScreen,
} from "@/features/guest"

interface JoinPageProps {
  params: Promise<{ eventId: string }>
}

export default async function JoinPage({ params }: JoinPageProps) {
  const { eventId } = await params
  const result = await getProjectAction(eventId)

  if (!result.success || !result.event) {
    notFound()
  }

  const event = result.event

  // Check if event has an owner company and if that company is deleted
  if (event.companyId) {
    const companyStatus = await getCompanyStatus(event.companyId)

    if (!companyStatus || companyStatus === "deleted") {
      return (
        <EventUnavailableScreen
          message="This event is no longer available. Please contact the event organizer for more information."
        />
      )
    }
  }

  // Check if event is archived
  if (event.status === "archived") {
    return (
      <EventUnavailableScreen
        message="This event has ended and is no longer accepting participants."
      />
    )
  }

  // Route based on activeEventId - new journey flow vs legacy flow
  if (event.activeEventId) {
    // Load journey and steps
    const journeyResult = await getJourneyForGuestAction(
      event.id,
      event.activeEventId
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
      <EventUnavailableScreen
        message="This journey is not configured. Please contact the event organizer."
      />
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
