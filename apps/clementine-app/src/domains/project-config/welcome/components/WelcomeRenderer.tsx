/**
 * WelcomeRenderer Component
 *
 * Renders the welcome screen for both edit mode (designer preview) and run mode
 * (guest interaction). Uses ThemedText and ThemedBackground primitives from shared
 * theming module.
 *
 * WYSIWYG Principle: What creators see in preview is exactly what guests see.
 *
 * Must be used within a ThemeProvider.
 */

import { ExperienceCard } from './ExperienceCard'
import type { ExperienceCardData } from './ExperienceCard'
import type { WelcomeConfig } from '@/domains/project-config/shared'
import type { MainExperienceReference } from '@/domains/project-config/experiences'
import { ThemedText, useEventTheme } from '@/shared/theming'
import { cn } from '@/shared/utils/style-utils'

export interface WelcomeRendererProps {
  /** Welcome config to render */
  welcome: WelcomeConfig
  /** Main experiences to display */
  mainExperiences?: MainExperienceReference[]
  /** Experience details for display (id, name, thumbnail only) */
  experienceDetails?: ExperienceCardData[]
  /**
   * Display mode
   * - edit: Non-interactive WYSIWYG preview in event designer
   * - run: Interactive guest experience with session creation
   */
  mode: 'edit' | 'run'
  /**
   * Callback when guest selects an experience (required when mode='run')
   * @param experienceId - ID of the selected experience
   */
  onSelectExperience?: (experienceId: string) => void
}

export function WelcomeRenderer({
  welcome,
  mainExperiences = [],
  experienceDetails = [],
  mode,
  onSelectExperience,
}: WelcomeRendererProps) {
  const { theme } = useEventTheme()

  // Filter to only show enabled experiences
  const enabledExperiences = mainExperiences.filter((ref) => ref.enabled)

  // Create a map of experience details for quick lookup
  const experienceMap = new Map(experienceDetails.map((exp) => [exp.id, exp]))

  // Get experience details for enabled references
  const displayExperiences = enabledExperiences
    .map((ref) => experienceMap.get(ref.experienceId))
    .filter((exp): exp is ExperienceCardData => exp !== undefined)

  const hasExperiences = displayExperiences.length > 0

  return (
    <div className="flex-1 min-h-0 overflow-y-auto flex flex-col p-8">
      <div className="w-full max-w-md mx-auto my-auto flex flex-col items-center gap-6">
        {/* Hero media */}
        {welcome.media?.url && (
          <div className="w-full">
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
          <ThemedText variant="body" className="text-center opacity-90 whitespace-pre-line">
            {welcome.description}
          </ThemedText>
        )}

        {/* Experiences section */}
        <div className="mt-4 w-full">
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
                  mode={mode}
                  onClick={
                    mode === 'run' && onSelectExperience
                      ? () => onSelectExperience(experience.id)
                      : undefined
                  }
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
      </div>
    </div>
  )
}
