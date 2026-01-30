/**
 * ExperienceGeneratePage Container
 *
 * Placeholder for the Generate tab (AI transform pipeline configuration).
 * This is a work-in-progress component that will be implemented in a future phase.
 */
import { Sparkles } from 'lucide-react'

/**
 * Generate tab placeholder with centered WIP message
 *
 * Shows a "Coming soon" message for future transform pipeline functionality.
 * Uses consistent styling with other placeholder states in the app.
 */
export function ExperienceGeneratePage() {
  return (
    <div className="flex flex-1 items-center justify-center h-full">
      <div className="text-center space-y-4">
        <Sparkles className="mx-auto h-12 w-12 text-muted-foreground" />
        <div>
          <h2 className="text-lg font-semibold">AI Transform Pipeline</h2>
          <p className="text-sm text-muted-foreground">
            Configure AI transformation settings for your experience.
          </p>
          <p className="text-xs text-muted-foreground mt-2">Coming soon</p>
        </div>
      </div>
    </div>
  )
}
