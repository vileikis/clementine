/**
 * ExperiencesPage Container
 *
 * Main container for the experience library page.
 * Displays list of experiences with profile filtering and loading states.
 */
import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Copy, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import {
  DeleteExperienceDialog,
  ExperienceListEmpty,
  ExperienceListItem,
  RenameExperienceDialog,
} from '../components'
import type { Experience, ExperienceProfile } from '@/domains/experience/shared'
import type { MenuSection } from '@/shared/components/ContextDropdownMenu'
import {
  profileMetadata,
  useDeleteExperience,
  useDuplicateExperience,
  useWorkspaceExperiences,
} from '@/domains/experience/shared'
import { Button } from '@/ui-kit/ui/button'
import { Skeleton } from '@/ui-kit/ui/skeleton'
import { cn } from '@/shared/utils/style-utils'

interface ExperiencesPageProps {
  /** Workspace ID for data fetching */
  workspaceId: string
  /** Workspace slug for navigation */
  workspaceSlug: string
}

/**
 * Profile filter options including "all"
 */
const profileOptions: {
  value: ExperienceProfile | null
  label: string
}[] = [
  { value: null, label: 'All' },
  { value: 'freeform', label: profileMetadata.freeform.label },
  { value: 'survey', label: profileMetadata.survey.label },
  { value: 'story', label: profileMetadata.story.label },
]

/**
 * Experience library page container
 *
 * Features:
 * - Lists all active experiences
 * - Profile filter tabs (All, Freeform, Survey, Story)
 * - Loading skeleton state
 * - Empty states (no experiences / no matches)
 * - Create experience button
 * - Rename experience via context menu
 * - Duplicate experience via context menu
 *
 * @example
 * ```tsx
 * <ExperiencesPage workspaceId="abc123" workspaceSlug="my-workspace" />
 * ```
 */
export function ExperiencesPage({
  workspaceId,
  workspaceSlug,
}: ExperiencesPageProps) {
  const navigate = useNavigate()
  const [profileFilter, setProfileFilter] = useState<ExperienceProfile | null>(
    null,
  )

  // Dialog state
  const [renameExperience, setRenameExperience] = useState<Experience | null>(
    null,
  )
  const [deleteExperienceTarget, setDeleteExperienceTarget] =
    useState<Experience | null>(null)

  // Fetch experiences with optional profile filter
  const { data: experiences, isLoading } = useWorkspaceExperiences(
    workspaceId,
    profileFilter ? { profile: profileFilter } : undefined,
  )

  // Mutations
  const deleteExperience = useDeleteExperience()
  const duplicateExperience = useDuplicateExperience()

  const handleCreateExperience = () => {
    navigate({
      to: '/workspace/$workspaceSlug/experiences/create',
      params: { workspaceSlug },
    })
  }

  const handleDeleteExperience = async () => {
    if (!deleteExperienceTarget) return

    try {
      await deleteExperience.mutateAsync({
        workspaceId,
        experienceId: deleteExperienceTarget.id,
      })
      toast.success('Experience deleted')
      setDeleteExperienceTarget(null)
    } catch {
      toast.error('Failed to delete experience')
    }
  }

  const handleDuplicate = async (exp: Experience) => {
    try {
      const result = await duplicateExperience.mutateAsync({
        workspaceId,
        experienceId: exp.id,
      })
      toast.success(`Duplicated as "${result.name}"`)
    } catch {
      toast.error("Couldn't duplicate experience")
    }
  }

  const getMenuSections = (exp: Experience): MenuSection[] => [
    {
      items: [
        {
          key: 'rename',
          label: 'Rename',
          icon: Pencil,
          onClick: () => setRenameExperience(exp),
        },
        {
          key: 'duplicate',
          label: 'Duplicate',
          icon: Copy,
          onClick: () => handleDuplicate(exp),
          disabled: duplicateExperience.isPending,
        },
      ],
    },
    {
      items: [
        {
          key: 'delete',
          label: 'Delete',
          icon: Trash2,
          onClick: () => setDeleteExperienceTarget(exp),
          destructive: true,
        },
      ],
    },
  ]

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-9 w-20" />
          ))}
        </div>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  // Determine empty state type
  const hasExperiences = experiences && experiences.length > 0
  const isFiltered = profileFilter !== null

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Experiences</h1>
        <Button onClick={handleCreateExperience}>Create Experience</Button>
      </div>

      {/* Profile filter tabs */}
      <div className="flex gap-2 mb-6">
        {profileOptions.map((option) => (
          <Button
            key={option.label}
            variant={profileFilter === option.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setProfileFilter(option.value)}
            className={cn(
              profileFilter === option.value && 'pointer-events-none',
            )}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {/* Experience list or empty state */}
      {!hasExperiences ? (
        <ExperienceListEmpty
          variant={isFiltered ? 'no-matches' : 'no-experiences'}
          profile={profileFilter ?? undefined}
          onCreate={handleCreateExperience}
          onClearFilter={() => setProfileFilter(null)}
        />
      ) : (
        <div className="space-y-4">
          {experiences.map((experience) => (
            <ExperienceListItem
              key={experience.id}
              experience={experience}
              workspaceSlug={workspaceSlug}
              menuSections={getMenuSections(experience)}
            />
          ))}
        </div>
      )}

      {/* Rename dialog */}
      {renameExperience && (
        <RenameExperienceDialog
          experienceId={renameExperience.id}
          workspaceId={workspaceId}
          initialName={renameExperience.name}
          open={!!renameExperience}
          onOpenChange={(open) => !open && setRenameExperience(null)}
        />
      )}

      {/* Delete dialog */}
      {deleteExperienceTarget && (
        <DeleteExperienceDialog
          open={!!deleteExperienceTarget}
          experienceName={deleteExperienceTarget.name}
          isDeleting={deleteExperience.isPending}
          onOpenChange={(open) => !open && setDeleteExperienceTarget(null)}
          onConfirm={handleDeleteExperience}
        />
      )}
    </div>
  )
}
