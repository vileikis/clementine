/**
 * ExperienceCreatePage Container
 *
 * Main content area for the Create tab (AI transform pipeline configuration).
 * Provides CRUD operations for AI Image nodes in the transform pipeline.
 */
import { useParams } from '@tanstack/react-router'

import { TransformPipelineEditor } from './TransformPipelineEditor'
import { useWorkspace } from '@/domains/workspace'
import { useWorkspaceExperience } from '@/domains/experience'

/**
 * Create tab with transform pipeline editor
 *
 * Features:
 * - Add/delete AI Image nodes
 * - View node list with cards
 * - Empty state when no nodes
 * - Delete confirmation dialog
 *
 * Phase 1b-2: CRUD operations and basic display (MVP)
 * Future phases will add: editor panel, prompt editing, refMedia management
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
        <TransformPipelineEditor
          experience={experience}
          workspaceId={workspace.id}
        />
      </div>
    </div>
  )
}
