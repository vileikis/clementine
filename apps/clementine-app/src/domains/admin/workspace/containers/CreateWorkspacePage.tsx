import { useEffect, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, CircleAlert, Sparkles } from 'lucide-react'
import { useCreateWorkspace } from '../hooks/useCreateWorkspace'
import { Button } from '@/ui-kit/ui/button'
import { Input } from '@/ui-kit/ui/input'
import { Label } from '@/ui-kit/ui/label'
import { generateSlug, isValidSlug } from '@/shared/utils/slug-utils'
import { WORKSPACE_NAME, WORKSPACE_SLUG } from '@/domains/workspace'

/**
 * Create workspace page
 *
 * Full-page form for creating a new workspace.
 *
 * Features:
 * - Auto-generates slug from workspace name
 * - Manual slug override with validation
 * - Real-time validation feedback
 * - Back button to return to workspace list
 */
export function CreateWorkspacePage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [isManualSlug, setIsManualSlug] = useState(false)

  const createMutation = useCreateWorkspace()

  // Auto-generate slug from name (unless manually overridden)
  useEffect(() => {
    if (!isManualSlug && name) {
      setSlug(generateSlug(name))
    }
  }, [name, isManualSlug])

  // Handle slug manual edit
  const handleSlugChange = (value: string) => {
    setSlug(value.toLowerCase())
    setIsManualSlug(true)
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate name
    if (
      !name ||
      name.length < WORKSPACE_NAME.min ||
      name.length > WORKSPACE_NAME.max
    ) {
      return
    }

    // Validate slug
    if (!isValidSlug(slug)) {
      return
    }

    try {
      const result = await createMutation.mutateAsync({ name, slug })
      // Navigate to workspace detail page
      await navigate({ to: `/workspace/${result.slug}` })
    } catch (error) {
      // Error is available in createMutation.error
      console.error('Failed to create workspace:', error)
    }
  }

  const isSlugValid = slug ? isValidSlug(slug) : true
  const isFormValid =
    name.length >= WORKSPACE_NAME.min &&
    name.length <= WORKSPACE_NAME.max &&
    isSlugValid

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      {/* Header with back button */}
      <div className="mb-8">
        <Link
          to="/admin/workspaces"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="size-4" />
          <span>Back to workspaces</span>
        </Link>
        <h1 className="text-3xl font-bold">Create Workspace</h1>
        <p className="text-muted-foreground mt-2">
          Create a new workspace to organize your AI photobooth experiences.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Workspace Name Input */}
        <div className="space-y-2">
          <Label htmlFor="workspace-name">
            Workspace Name
            <span className="text-destructive ml-0.5">*</span>
          </Label>
          <Input
            id="workspace-name"
            name="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={createMutation.isPending}
            placeholder="Acme Corp"
            className="min-h-[44px]"
            maxLength={WORKSPACE_NAME.max}
            aria-invalid={name.length > 0 && name.length < WORKSPACE_NAME.min}
            aria-describedby="workspace-name-description"
          />
          <p
            id="workspace-name-description"
            className="text-sm text-muted-foreground"
          >
            A friendly name for your workspace ({name.length}/
            {WORKSPACE_NAME.max} characters)
          </p>
        </div>

        {/* Workspace Slug Input */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="workspace-slug">
              URL Slug
              <span className="text-destructive ml-0.5">*</span>
            </Label>
            {!isManualSlug && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Sparkles className="size-3" />
                <span>Auto-generated</span>
              </div>
            )}
          </div>
          <Input
            id="workspace-slug"
            name="slug"
            type="text"
            required
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            disabled={createMutation.isPending}
            placeholder="acme-corp"
            className="min-h-[44px]"
            maxLength={WORKSPACE_SLUG.max}
            aria-invalid={slug.length > 0 && !isSlugValid}
            aria-describedby="workspace-slug-description"
          />
          <p
            id="workspace-slug-description"
            className={`text-sm ${
              slug.length > 0 && !isSlugValid
                ? 'text-destructive'
                : 'text-muted-foreground'
            }`}
          >
            {slug.length > 0 && !isSlugValid
              ? 'Slug must be lowercase, alphanumeric with hyphens (no leading/trailing hyphens)'
              : 'Used in URLs: /workspace/your-slug'}
          </p>
        </div>

        {/* Error Message */}
        {createMutation.error && (
          <div className="rounded-md bg-destructive/10 p-4">
            <div className="flex gap-3">
              <div className="shrink-0">
                <CircleAlert className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-destructive font-medium">
                  Failed to create workspace
                </p>
                <p className="text-sm text-destructive mt-1">
                  {createMutation.error instanceof Error
                    ? createMutation.error.message
                    : 'An unexpected error occurred'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate({ to: '/admin/workspaces' })}
            disabled={createMutation.isPending}
            className="min-h-[44px]"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!isFormValid || createMutation.isPending}
            className="min-h-[44px]"
          >
            {createMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground" />
                <span>Creating...</span>
              </>
            ) : (
              <span>Create Workspace</span>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
