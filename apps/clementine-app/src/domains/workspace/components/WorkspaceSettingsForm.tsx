import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { useUpdateWorkspace } from '../hooks/useUpdateWorkspace'
import { updateWorkspaceSchema } from '../schemas/workspace.schemas'
import type { UpdateWorkspaceInput, Workspace } from '../types/workspace.types'
import { Button } from '@/ui-kit/components/button'
import { Input } from '@/ui-kit/components/input'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/ui-kit/components/form'

interface WorkspaceSettingsFormProps {
  workspace: Workspace
}

/**
 * Workspace settings form component
 *
 * Allows admins to edit workspace name and slug.
 * Features:
 * - Real-time validation with Zod schema
 * - Slug uniqueness validation
 * - Automatic redirect after successful slug change
 * - Error handling with inline error messages
 *
 * @example
 * ```tsx
 * <WorkspaceSettingsForm workspace={workspace} />
 * ```
 */
export function WorkspaceSettingsForm({
  workspace,
}: WorkspaceSettingsFormProps) {
  const navigate = useNavigate()
  const updateMutation = useUpdateWorkspace()

  const form = useForm<UpdateWorkspaceInput>({
    resolver: zodResolver(updateWorkspaceSchema),
    defaultValues: {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
    },
  })

  const onSubmit = async (values: UpdateWorkspaceInput) => {
    try {
      // Track if slug is changing for redirect
      const slugChanged = values.slug !== workspace.slug

      // Update workspace
      await updateMutation.mutateAsync(values)

      // If slug changed, redirect to new URL
      if (slugChanged && values.slug) {
        navigate({
          to: '/workspace/$workspaceSlug/settings',
          params: { workspaceSlug: values.slug },
        })
      }
    } catch (error) {
      // Handle slug conflict error
      if (
        error instanceof Error &&
        error.message.includes('Slug already in use')
      ) {
        form.setError('slug', {
          type: 'manual',
          message: 'Slug already in use',
        })
      } else {
        // Generic error handling
        form.setError('root', {
          type: 'manual',
          message: 'Failed to update workspace. Please try again.',
        })
      }
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 max-w-2xl"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Workspace Name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Enter workspace name"
                  disabled={updateMutation.isPending}
                />
              </FormControl>
              <FormDescription>
                The display name for this workspace (1-100 characters)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Workspace Slug</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="enter-workspace-slug"
                  disabled={updateMutation.isPending}
                />
              </FormControl>
              <FormDescription>
                URL-safe identifier (lowercase, alphanumeric, hyphens only).
                Changing this will redirect you to the new URL.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.formState.errors.root && (
          <div className="text-sm text-destructive">
            {form.formState.errors.root.message}
          </div>
        )}

        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={updateMutation.isPending || !form.formState.isDirty}
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>

          {form.formState.isDirty && (
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Form>
  )
}
