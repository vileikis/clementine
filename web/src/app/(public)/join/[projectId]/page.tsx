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
  params: Promise<{ projectId: string }>
}

export default async function JoinPage({ params }: JoinPageProps) {
  const { projectId } = await params
  const result = await getProjectAction(projectId)

  if (!result.success || !result.project) {
    notFound()
  }

  const project = result.project

  // Check if project has an owner company and if that company is deleted
  if (project.companyId) {
    const companyStatus = await getCompanyStatus(project.companyId)

    if (!companyStatus || companyStatus === "deleted") {
      return (
        <EventUnavailableScreen
          message="This experience is no longer available. Please contact the organizer for more information."
        />
      )
    }
  }

  // Check if project is archived
  if (project.status === "archived") {
    return (
      <EventUnavailableScreen
        message="This experience has ended and is no longer accepting participants."
      />
    )
  }

  // Route based on activeEventId - new journey flow vs legacy flow
  if (project.activeEventId) {
    // Load journey and steps
    const journeyResult = await getJourneyForGuestAction(
      project.id,
      project.activeEventId
    )

    // Load experiences for experience-picker steps
    const experiencesResult = await getExperiencesForGuestAction(project.id)

    // Validate journey exists and has steps
    if (
      journeyResult.success &&
      journeyResult.journey &&
      journeyResult.steps.length > 0 &&
      experiencesResult.success
    ) {
      return (
        <JourneyGuestContainer
          event={project}
          journey={journeyResult.journey}
          steps={journeyResult.steps}
          experiences={experiencesResult.experiences}
        />
      )
    }

    // Journey not found or has no steps - show error
    return (
      <EventUnavailableScreen
        message="This experience is not configured. Please contact the organizer."
      />
    )
  }

  // Fallback to legacy flow when no activeJourneyId
  return (
    <BrandThemeProvider brandColor={project.theme.primaryColor}>
      <GuestFlowContainer
        eventId={project.id}
        eventTitle={project.name}
      />
    </BrandThemeProvider>
  )
}
