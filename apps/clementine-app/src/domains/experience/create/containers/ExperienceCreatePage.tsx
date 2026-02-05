/**
 * ExperienceCreatePage Container
 *
 * Main content area for the Create tab (AI image generation configuration).
 * Renders the CreateTabForm for outcome-based configuration.
 *
 * @see spec.md - Admin Create Tab UX
 */
import { useParams } from '@tanstack/react-router'

import { CreateTabForm } from '../components/CreateTabForm'
import { useWorkspace } from '@/domains/workspace'
import { useWorkspaceExperience } from '@/domains/experience'

/**
 * Create tab with outcome-based configuration form
 *
 * Features:
 * - Outcome type selection (Image, GIF coming soon, Video coming soon)
 * - AI generation configuration (prompt, model, aspect ratio)
 * - Reference media upload and management
 * - Autosave with debounced prompt saves
 */
export function ExperienceCreatePage() {
  const { workspaceSlug, experienceId } = useParams({ strict: false })
  const { data: workspace } = useWorkspace(workspaceSlug ?? '')
  const { data: experience } = useWorkspaceExperience(
    workspace?.id ?? '',
    experienceId ?? '',
  )

  // Safety check - should not happen due to parent route
  if (!experience || !workspace) {
    return null
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden h-full">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-xl">
          <CreateTabForm experience={experience} workspaceId={workspace.id} />
        </div>
      </div>
    </div>
  )
}
