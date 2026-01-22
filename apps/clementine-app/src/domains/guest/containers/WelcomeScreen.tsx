/**
 * WelcomeScreen Container
 *
 * Simplified welcome screen that assumes ready state from GuestContext.
 * All initialization (auth, guest access, guest record) is handled by
 * GuestLayout before this component renders.
 *
 * Experiences are lazy-loaded and converted to card data for display.
 *
 * Responsibilities:
 * - Display welcome screen with available experiences
 * - Handle experience selection and navigation
 *
 * User Stories:
 * - US2: Guest Selects an Experience (experience selection handler)
 * - US4: Guest Views Event with No Available Experiences (empty state)
 */
import { useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'

import { useGuestContext } from '../contexts'
import type { ExperienceCardData } from '@/domains/event/welcome'
import { DEFAULT_WELCOME, WelcomeRenderer } from '@/domains/event/welcome'
import { ThemeProvider } from '@/shared/theming'
import { DEFAULT_THEME } from '@/domains/event/theme/constants'

/**
 * Welcome screen component (used within GuestLayout)
 *
 * This component only renders when GuestContext is available (i.e., when
 * GuestLayout has completed initialization). It accesses project, event,
 * and experiences data from context instead of fetching them directly.
 *
 * Experiences are lazy-loaded - the welcome screen shell renders immediately
 * and experience cards appear once loaded.
 *
 * On experience selection, navigates to the experience page. Session creation
 * is handled by ExperiencePage via useInitSession.
 *
 * @example
 * ```tsx
 * // In route file: src/app/join/$projectId/index.tsx
 * export const Route = createFileRoute('/join/$projectId/')({
 *   component: WelcomeScreenRoute,
 * })
 *
 * function WelcomeScreenRoute() {
 *   return <WelcomeScreen />
 * }
 * ```
 */
export function WelcomeScreen() {
  const navigate = useNavigate()
  const { project, event, experiences } = useGuestContext()

  const publishedConfig = event.publishedConfig!
  const welcome = publishedConfig.welcome ?? DEFAULT_WELCOME
  const theme = publishedConfig.theme ?? DEFAULT_THEME
  const mainExperiences = publishedConfig.experiences?.main ?? []

  // Derive card data from full experience documents
  const experienceCardData: ExperienceCardData[] = useMemo(
    () =>
      experiences.map((exp) => ({
        id: exp.id,
        name: exp.name,
        thumbnailUrl: exp.media?.url ?? null,
      })),
    [experiences],
  )

  // Handle experience selection - just navigate, session created in ExperiencePage
  const handleSelectExperience = (experienceId: string) => {
    void navigate({
      to: '/join/$projectId/experience/$experienceId',
      params: { projectId: project.id, experienceId },
    })
  }

  return (
    <div className="h-screen">
      <ThemeProvider theme={theme}>
        <WelcomeRenderer
          welcome={welcome}
          mainExperiences={mainExperiences}
          experienceDetails={experienceCardData}
          mode="run"
          onSelectExperience={handleSelectExperience}
        />
      </ThemeProvider>
    </div>
  )
}
