/**
 * WelcomePreview Component
 *
 * Display-only preview component showing how the welcome screen will appear
 * in the guest-facing experience. Uses ThemedText and ThemedBackground
 * primitives from shared theming module.
 *
 * Must be used within a ThemeProvider.
 */

import type { WelcomeConfig } from '@/domains/event/shared'
import type { MainExperienceReference } from '@/domains/event/experiences'
import type { Experience } from '@/domains/experience/shared'
import { ThemedBackground, ThemedText, useEventTheme } from '@/shared/theming'
import { ExperienceCard } from '@/domains/event/experiences'
import { cn } from '@/shared/utils/style-utils'

export interface WelcomePreviewProps {
  /** Welcome config to preview */
  welcome: WelcomeConfig
  /** Main experiences to display */
  mainExperiences?: MainExperienceReference[]
  /** Experience details (fetched separately) */
  experienceDetails?: Experience[]
}

export function WelcomePreview({
  welcome,
  mainExperiences = [],
  experienceDetails = [],
}: WelcomePreviewProps) {
  const { theme } = useEventTheme()

  // Filter to only show enabled experiences
  const enabledExperiences = mainExperiences.filter((ref) => ref.enabled)

  // Create a map of experience details for quick lookup
  const experienceMap = new Map(experienceDetails.map((exp) => [exp.id, exp]))

  // Get experience details for enabled references
  const displayExperiences = enabledExperiences
    .map((ref) => experienceMap.get(ref.experienceId))
    .filter((exp): exp is Experience => exp !== undefined)

  const hasExperiences = displayExperiences.length > 0

  return (
    <ThemedBackground
      className="h-full w-full"
      contentClassName="flex flex-col items-center gap-6 p-8"
    >
      {/* Hero media */}
      {welcome.media?.url && (
        <div className="w-full max-w-md">
          <img
            src={welcome.media.url}
            alt="Welcome hero"
            className="w-full max-h-48 object-contain rounded-lg"
          />
        </div>
      )}

      {/* Title */}
      <ThemedText variant="heading" className="text-center">
        {welcome.title}
      </ThemedText>

      {/* Description */}
      {welcome.description && (
        <ThemedText variant="body" className="text-center opacity-90">
          {welcome.description}
        </ThemedText>
      )}

      {/* Experiences section */}
      <div className="mt-4 w-full max-w-md">
        {hasExperiences ? (
          <div
            className={cn('w-full', {
              'space-y-3': welcome.layout === 'list',
              'grid grid-cols-2 gap-3': welcome.layout === 'grid',
            })}
          >
            {displayExperiences.map((experience) => (
              <ExperienceCard
                key={experience.id}
                experience={experience}
                layout={welcome.layout}
                mode="edit"
              />
            ))}
          </div>
        ) : (
          <div
            className="rounded-lg border-2 border-dashed border-current/20 p-6 text-center"
            style={{ color: theme.text.color }}
          >
            <ThemedText variant="small" className="opacity-60">
              Experiences will appear here
            </ThemedText>
          </div>
        )}
      </div>
    </ThemedBackground>
  )
}
