/**
 * CreateExperiencePage Container
 *
 * Page for creating a new experience. Shows a type picker — selecting a type
 * immediately creates the experience with a default name and navigates
 * to the editor.
 *
 * @see specs/081-experience-type-flattening — US1
 */
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'

import { ExperienceTypePicker } from '../components'
import { useCreateExperience } from '@/domains/experience/shared'
import type { ExperienceType } from '@clementine/shared'

interface CreateExperiencePageProps {
  /** Workspace ID for experience creation */
  workspaceId: string
  /** Workspace slug for navigation */
  workspaceSlug: string
}

export function CreateExperiencePage({
  workspaceId,
  workspaceSlug,
}: CreateExperiencePageProps) {
  const navigate = useNavigate()
  const createExperience = useCreateExperience()

  const handleTypeSelect = async (type: ExperienceType) => {
    try {
      const result = await createExperience.mutateAsync({
        workspaceId,
        name: 'Untitled Experience',
        type,
      })

      toast.success('Experience created')

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

  return (
    <div className="px-6 pt-16">
      <div className="mx-auto" style={{ maxWidth: '1140px' }}>
        <ExperienceTypePicker
          onTypeSelect={handleTypeSelect}
          disabled={createExperience.isPending}
        />
      </div>
    </div>
  )
}
