import { notFound } from "next/navigation"
import { Suspense } from "react"
import { getProjectAction } from "@/features/projects/actions"
import { getEventAction } from "@/features/events/actions"
import { getExperience } from "@/features/experiences/repositories/experiences.repository"
import { ThemeProvider, ThemedBackground } from "@/features/theming"
import {
  NoActiveEvent,
  LoadingScreen,
} from "@/features/guest/components"
import { JoinPageClient } from "./JoinPageClient"
import type { Experience } from "@/features/experiences"

interface JoinPageProps {
  params: Promise<{ projectId: string }>
}

export default async function JoinPage({ params }: JoinPageProps) {
  const { projectId } = await params

  // Fetch project
  const projectResult = await getProjectAction(projectId)
  if (!projectResult.success || !projectResult.project) {
    notFound()
  }

  const project = projectResult.project

  // Check if project is live
  if (project.status !== "live") {
    notFound()
  }

  // Check if there's an active event
  if (!project.activeEventId) {
    return (
      <ThemeProvider theme={project.theme}>
        <ThemedBackground
          background={project.theme.background}
          fontFamily={project.theme.fontFamily}
          className="flex h-screen flex-col"
        >
          <NoActiveEvent />
        </ThemedBackground>
      </ThemeProvider>
    )
  }

  // Fetch the active event
  const eventResult = await getEventAction(projectId, project.activeEventId)
  if (!eventResult.success || !eventResult.data?.event) {
    return (
      <ThemeProvider theme={project.theme}>
        <ThemedBackground
          background={project.theme.background}
          fontFamily={project.theme.fontFamily}
          className="flex h-screen flex-col"
        >
          <NoActiveEvent />
        </ThemedBackground>
      </ThemeProvider>
    )
  }

  const event = eventResult.data.event

  // Filter enabled experiences and build experiences map
  const enabledExperiences = event.experiences.filter((exp) => exp.enabled)
  const experiencesMap = new Map<string, Experience>()

  // Fetch experience details for enabled experiences
  await Promise.all(
    enabledExperiences.map(async (expLink) => {
      const experience = await getExperience(expLink.experienceId)
      if (experience) {
        experiencesMap.set(expLink.experienceId, experience)
      }
    })
  )

  // Note: If no enabled experiences, WelcomeContent will show "No experiences available yet"
  // instead of a separate empty state screen

  // Render client component for interactive experience
  // Suspense boundary handles loading state for searchParams
  return (
    <Suspense
      fallback={
        <ThemeProvider theme={event.theme}>
          <ThemedBackground
            background={event.theme.background}
            fontFamily={event.theme.fontFamily}
            className="flex h-screen flex-col"
          >
            <LoadingScreen />
          </ThemedBackground>
        </ThemeProvider>
      }
    >
      <JoinPageClient
        projectId={projectId}
        event={event}
        experiencesMap={experiencesMap}
      />
    </Suspense>
  )
}
