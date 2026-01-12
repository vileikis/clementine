/**
 * CreateExperiencePage Container
 *
 * Page container for creating a new experience.
 * Wraps the CreateExperienceForm with navigation handling.
 */
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'

import { CreateExperienceForm } from '../components'
import { useCreateExperience } from '@/domains/experience/shared'
import { Card } from '@/ui-kit/ui/card'

interface CreateExperiencePageProps {
  /** Workspace ID for experience creation */
  workspaceId: string
  /** Workspace slug for navigation */
  workspaceSlug: string
}

/**
 * Create experience page container
 *
 * Features:
 * - Form for name and profile selection
 * - Redirects to editor on success
 * - Shows toast notifications
 * - Cancel button returns to library
 *
 * @example
 * ```tsx
 * <CreateExperiencePage
 *   workspaceId="abc123"
 *   workspaceSlug="my-workspace"
 * />
 * ```
 */
export function CreateExperiencePage({
  workspaceId,
  workspaceSlug,
}: CreateExperiencePageProps) {
  const navigate = useNavigate()
  const createExperience = useCreateExperience()

  const handleSubmit = async (
    data: Parameters<typeof createExperience.mutateAsync>[0],
  ) => {
    try {
      const result = await createExperience.mutateAsync(data)

      toast.success('Experience created')

      // Navigate to editor
      navigate({
        to: '/workspace/$workspaceSlug/experiences/$experienceId',
        params: {
          workspaceSlug,
          experienceId: result.experienceId,
        },
      })
    } catch {
      toast.error('Failed to create experience')
    }
  }

  const handleCancel = () => {
    navigate({
      to: '/workspace/$workspaceSlug/experiences',
      params: { workspaceSlug },
    })
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Create Experience</h1>

      <Card className="p-6 max-w-xl">
        <CreateExperienceForm
          workspaceId={workspaceId}
          onSubmit={handleSubmit}
          isSubmitting={createExperience.isPending}
          onCancel={handleCancel}
        />
      </Card>
    </div>
  )
}
