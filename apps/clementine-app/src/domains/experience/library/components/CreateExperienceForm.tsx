/**
 * CreateExperienceForm Component
 *
 * Form for creating a new experience with name and profile selection.
 * Uses react-hook-form with Zod validation.
 */
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { ProfileSelector } from './ProfileSelector'
import type {
  CreateExperienceInput,
  ExperienceProfile,
} from '@/domains/experience/shared'
import { createExperienceInputSchema } from '@/domains/experience/shared'
import { Button } from '@/ui-kit/ui/button'
import { Input } from '@/ui-kit/ui/input'
import { Label } from '@/ui-kit/ui/label'

interface CreateExperienceFormProps {
  /** Workspace ID where experience will be created */
  workspaceId: string
  /** Callback on successful form submission */
  onSubmit: (data: CreateExperienceInput) => Promise<void>
  /** Whether form submission is in progress */
  isSubmitting?: boolean
  /** Callback to cancel and go back */
  onCancel?: () => void
}

/**
 * Form component for creating a new experience
 *
 * @example
 * ```tsx
 * <CreateExperienceForm
 *   workspaceId="abc123"
 *   onSubmit={async (data) => {
 *     const result = await createExperience.mutateAsync(data)
 *     navigate(`/experiences/${result.experienceId}`)
 *   }}
 *   isSubmitting={createExperience.isPending}
 *   onCancel={() => navigate(-1)}
 * />
 * ```
 */
export function CreateExperienceForm({
  workspaceId,
  onSubmit,
  isSubmitting,
  onCancel,
}: CreateExperienceFormProps) {
  const form = useForm<CreateExperienceInput>({
    resolver: zodResolver(createExperienceInputSchema),
    defaultValues: {
      workspaceId,
      name: '',
      profile: 'freeform',
    },
  })

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSubmit(data)
  })

  const selectedProfile = form.watch('profile')

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name field */}
      <div className="space-y-2">
        <Label htmlFor="name">Experience Name</Label>
        <Input
          id="name"
          placeholder="Enter experience name"
          {...form.register('name')}
          disabled={isSubmitting}
        />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      {/* Profile selector */}
      <ProfileSelector
        value={selectedProfile}
        onChange={(profile: ExperienceProfile) =>
          form.setValue('profile', profile)
        }
        disabled={isSubmitting}
        error={form.formState.errors.profile?.message}
      />

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Experience'}
        </Button>
      </div>
    </form>
  )
}
