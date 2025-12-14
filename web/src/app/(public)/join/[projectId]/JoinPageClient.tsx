"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useCallback, useMemo, useTransition } from "react"
import { ThemeProvider, ThemedBackground } from "@/features/theming"
import {
  WelcomeContent,
  ExperienceScreen,
  LoadingScreen,
  GuestProvider,
  useGuestContext,
} from "@/features/guest"
import { useSession } from "@/features/guest/hooks"
import type { Event, EventWelcome } from "@/features/events/types/event.types"
import { DEFAULT_EVENT_WELCOME } from "@/features/events/types/event.types"
import type { Experience } from "@/features/experiences"

interface JoinPageClientProps {
  /** Project ID from URL */
  projectId: string
  /** Active event data */
  event: Event
  /** Pre-fetched experience details map */
  experiencesMap: Map<string, Experience>
}

/**
 * Client component for the join page.
 * Wraps content with GuestProvider for authentication.
 */
export function JoinPageClient({
  projectId,
  event,
  experiencesMap,
}: JoinPageClientProps) {
  return (
    <GuestProvider projectId={projectId}>
      <ThemeProvider theme={event.theme}>
        <ThemedBackground
          background={event.theme.background}
          fontFamily={event.theme.fontFamily}
          className="h-screen"
        >
          <JoinPageContent
            projectId={projectId}
            event={event}
            experiencesMap={experiencesMap}
          />
        </ThemedBackground>
      </ThemeProvider>
    </GuestProvider>
  )
}

/**
 * Inner content that uses guest context and session management.
 */
function JoinPageContent({
  projectId,
  event,
  experiencesMap,
}: JoinPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { guest, isLoading: isAuthLoading } = useGuestContext()
  const [, startTransition] = useTransition()

  // Read URL params
  const experienceId = searchParams.get("exp")
  const sessionIdFromUrl = searchParams.get("s")

  // Get normalized welcome config with fallback (must be before any returns)
  const welcome: EventWelcome = useMemo(
    () => event.welcome ?? DEFAULT_EVENT_WELCOME,
    [event.welcome]
  )

  // Handle session change - update URL with new session ID
  const handleSessionChange = useCallback(
    (newSessionId: string) => {
      if (experienceId) {
        startTransition(() => {
          router.replace(`/join/${projectId}?exp=${experienceId}&s=${newSessionId}`)
        })
      }
    },
    [projectId, experienceId, router]
  )

  // Use session hook for validation and resume
  const {
    session,
    loading: isSessionLoading,
    createNewSession,
  } = useSession({
    projectId,
    experienceId,
    sessionId: sessionIdFromUrl,
    eventId: event.id,
    guestId: guest?.id ?? null,
    onSessionChange: handleSessionChange,
  })

  // Handle experience selection - create new session and navigate
  const handleExperienceClick = useCallback(
    async (expId: string) => {
      const newSession = await createNewSession(expId)
      if (newSession) {
        startTransition(() => {
          router.push(`/join/${projectId}?exp=${expId}&s=${newSession.id}`)
        })
      } else {
        // Navigate anyway, useSession will create on mount
        startTransition(() => {
          router.push(`/join/${projectId}?exp=${expId}`)
        })
      }
    },
    [projectId, createNewSession, router]
  )

  // Handle home navigation
  const handleHomeClick = useCallback(() => {
    startTransition(() => {
      router.push(`/join/${projectId}`)
    })
  }, [projectId, router])

  // Get experience name for display
  const getExperienceName = (expId: string): string => {
    const experience = experiencesMap.get(expId)
    const expLink = event.experiences.find((e) => e.experienceId === expId)
    return expLink?.label || experience?.name || "Experience"
  }

  // Show loading screen while authenticating or validating session
  if (isAuthLoading || (experienceId && isSessionLoading)) {
    return (
      <LoadingScreen
        message={isSessionLoading ? "Resuming session..." : "Loading..."}
      />
    )
  }

  // If experience param is present, show experience screen
  if (experienceId) {
    return (
      <ExperienceScreen
        experienceName={getExperienceName(experienceId)}
        experienceId={experienceId}
        guestId={guest?.id}
        sessionId={session?.id || sessionIdFromUrl || "no-session"}
        onHomeClick={handleHomeClick}
      />
    )
  }

  // Show welcome screen with experience cards
  return (
    <WelcomeContent
      welcome={welcome}
      event={event}
      experiencesMap={experiencesMap}
      onExperienceClick={handleExperienceClick}
    />
  )
}
