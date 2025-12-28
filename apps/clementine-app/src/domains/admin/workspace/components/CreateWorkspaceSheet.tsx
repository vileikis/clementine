import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { CircleAlert, Sparkles } from 'lucide-react'
import { useCreateWorkspace } from '../hooks/useCreateWorkspace'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/ui-kit/components/sheet'
import { Button } from '@/ui-kit/components/button'
import { Input } from '@/ui-kit/components/input'
import { Label } from '@/ui-kit/components/label'
import { generateSlug, isValidSlug } from '@/shared/utils/slug-utils'
import {
  WORKSPACE_NAME,
  WORKSPACE_SLUG,
} from '@/domains/workspace/constants/workspace.constants'

interface CreateWorkspaceSheetProps {
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

/**
 * Sheet component for creating a new workspace
 *
 * Features:
 * - Auto-generates slug from workspace name
 * - Manual slug override with validation
 * - Real-time validation feedback
 * - Mobile-friendly (Sheet slides from right)
 */
export function CreateWorkspaceSheet({
  trigger,
  open,
  onOpenChange,
}: CreateWorkspaceSheetProps) {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [isManualSlug, setIsManualSlug] = useState(false)

  const createMutation = useCreateWorkspace()

  // Handle controlled open state
  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen)
    onOpenChange?.(newOpen)

    // Reset form when closed
    if (!newOpen) {
      setName('')
      setSlug('')
      setIsManualSlug(false)
      createMutation.reset()
    }
  }

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
      // Close sheet on success
      handleOpenChange(false)
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
    <Sheet open={open ?? isOpen} onOpenChange={handleOpenChange}>
      {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}

      <SheetContent>
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <SheetHeader>
            <SheetTitle>Create Workspace</SheetTitle>
            <SheetDescription>
              Create a new workspace to organize your AI photobooth experiences.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 flex flex-col gap-6 py-4">
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
                aria-invalid={
                  name.length > 0 && name.length < WORKSPACE_NAME.min
                }
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
          </div>

          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
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
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
