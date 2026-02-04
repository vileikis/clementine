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
 * - Check pregate requirement and redirect if needed
 *
 * User Stories:
 * - US1: Guest Executes Main Experience
 * - US2: Guest Completes Pregate Before Main Experience (pregate check)
 * - US4: Guest Views Event with No Available Experiences (empty state)
 */
import { useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'

import { useGuestContext } from '../contexts'
import { usePregate } from '../hooks'
import type { ExperienceCardData } from '@/domains/project-config/welcome'
import {
  DEFAULT_WELCOME,
  WelcomeRenderer,
} from '@/domains/project-config/welcome'
import {
  ThemeProvider,
  ThemedBackground,
  useBodyThemeSync,
} from '@/shared/theming'
import { DEFAULT_THEME } from '@/domains/project-config/theme/constants'

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
 * On experience selection:
 * - If pregate is required → navigates to pregate route with selected experience ID
 * - If no pregate → navigates directly to experience page
 *
 * Session creation is handled by the destination page (PregatePage or ExperiencePage).
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
  const { project, guest, experiences } = useGuestContext()

  const publishedConfig = project.publishedConfig!
  const welcome = publishedConfig.welcome ?? DEFAULT_WELCOME
  const theme = publishedConfig.theme ?? DEFAULT_THEME
  const mainExperiences = publishedConfig.experiences?.main ?? []
  const experiencesConfig = publishedConfig.experiences ?? null

  // Sync body background for Safari mobile immersive experience
  useBodyThemeSync(theme.background.color)

  // Pregate check hook
  const { needsPregate } = usePregate(guest, experiencesConfig)

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

  /**
   * Handle experience selection
   * Routes to pregate if required, otherwise directly to experience
   */
  const handleSelectExperience = (experienceId: string) => {
    if (needsPregate()) {
      // Route to pregate with selected experience ID preserved
      // Uses push navigation so back returns to welcome
      void navigate({
        to: '/join/$projectId/pregate',
        params: { projectId: project.id },
        search: { experience: experienceId },
      })
    } else {
      // Route directly to experience
      // Uses push navigation so back returns to welcome
      void navigate({
        to: '/join/$projectId/experience/$experienceId',
        params: { projectId: project.id, experienceId },
      })
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <ThemedBackground className="h-dvh">
        <WelcomeRenderer
          welcome={welcome}
          mainExperiences={mainExperiences}
          experienceDetails={experienceCardData}
          mode="run"
          onSelectExperience={handleSelectExperience}
        />
      </ThemedBackground>
    </ThemeProvider>
  )
}
