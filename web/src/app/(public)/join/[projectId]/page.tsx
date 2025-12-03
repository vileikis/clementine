import { getProjectAction } from "@/features/projects/actions"
import { getCompanyStatus } from "@/features/companies/repositories/companies.repository"
import { notFound } from "next/navigation"
import {
  BrandThemeProvider,
  GuestFlowContainer,
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

  // Legacy guest flow
  // Note: Journey-based flow (JourneyGuestContainer) removed in Phase 3 cleanup.
  // Experience Engine (Phase 7) will provide the new guest flow.
  return (
    <BrandThemeProvider brandColor={project.theme.primaryColor}>
      <GuestFlowContainer
        eventId={project.id}
        eventTitle={project.name}
      />
    </BrandThemeProvider>
  )
}
