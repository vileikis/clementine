/**
 * ExperiencePreviewModal
 *
 * Modal for previewing an experience in run mode.
 * Creates a preview session and runs through all steps using the runtime engine.
 *
 * Features:
 * - Creates preview session on open
 * - Full step execution with navigation
 * - Themed display using experience config
 * - Close/dismiss at any time
 * - Completion feedback (toast)
 *
 * @example
 * ```tsx
 * function ExperienceDesigner({ experience, workspaceId }) {
 *   const [showPreview, setShowPreview] = useState(false)
 *
 *   return (
 *     <>
 *       <Button onClick={() => setShowPreview(true)}>Preview</Button>
 *       <ExperiencePreviewModal
 *         open={showPreview}
 *         onOpenChange={setShowPreview}
 *         experience={experience}
 *         workspaceId={workspaceId}
 *       />
 *     </>
 *   )
 * }
 * ```
 */
import { useCallback, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { ExperienceRuntime } from '../../runtime'
import { PreviewRuntimeContent } from '../components'
import type { Experience } from '@/domains/experience/shared'
import type { Theme } from '@/shared/theming'
import { useGhostProject } from '@/domains/project/shared'
import { useCreateSession, useSubscribeSession } from '@/domains/session'
import { ThemeProvider, themeSchema } from '@/shared/theming'
import { FullscreenPreviewShell } from '@/shared/preview-shell'
import { Button } from '@/ui-kit/ui/button'

/**
 * Props for ExperiencePreviewModal
 */
export interface ExperiencePreviewModalProps {
  /** Whether the modal is open */
  open: boolean
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void
  /** The experience to preview */
  experience: Experience
  /** Workspace ID for session context */
  workspaceId: string
}

/**
 * Default theme for preview (using schema defaults)
 */
const DEFAULT_PREVIEW_THEME: Theme = themeSchema.parse({})

/**
 * ExperiencePreviewModal Component
 *
 * Full-screen modal for previewing experience execution.
 * Creates a session and runs through steps in run mode.
 */
export function ExperiencePreviewModal({
  open,
  onOpenChange,
  experience,
  workspaceId,
}: ExperiencePreviewModalProps) {
  // Ghost project for preview sessions
  const { data: ghostProjectId, isLoading: isGhostLoading } =
    useGhostProject(workspaceId)

  // Session ID state - enables subscription once session is created
  const [sessionId, setSessionId] = useState<string | null>(null)

  // Mutations
  const createSession = useCreateSession()

  // Subscribe to session updates (disabled until sessionId is set)
  const { data: session } = useSubscribeSession(
    sessionId && ghostProjectId ? ghostProjectId : null,
    sessionId,
  )

  // Get steps from draft config
  const steps = experience.draft?.steps ?? []

  // Theme for preview (using default for now)
  const previewTheme = DEFAULT_PREVIEW_THEME

  // Derived state for cleaner render conditions
  const isLoading = isGhostLoading || createSession.isPending
  const error = createSession.error
    ? createSession.error instanceof Error
      ? createSession.error.message
      : 'Failed to create session'
    : null
  const isReady = !isLoading && !error && session

  // Initialize session when modal opens (wait for ghost project)
  useEffect(() => {
    if (!open || sessionId || !ghostProjectId) {
      return
    }

    let cancelled = false

    createSession
      .mutateAsync({
        projectId: ghostProjectId,
        workspaceId,
        eventId: null, // No event for preview sessions
        experienceId: experience.id,
        mode: 'preview',
        configSource: 'draft',
      })
      .then((result) => {
        if (cancelled) return
        setSessionId(result.sessionId)
      })
      .catch(() => {
        // Error is captured in createSession.error
      })

    return () => {
      cancelled = true
    }
  }, [
    open,
    sessionId,
    ghostProjectId,
    workspaceId,
    experience.id,
    createSession.mutateAsync,
  ])

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setSessionId(null)
      createSession.reset()
    }
  }, [open, createSession.reset])

  // Handle close
  const handleClose = useCallback(() => {
    onOpenChange(false)
  }, [onOpenChange])

  // Handle experience completion
  const handleComplete = useCallback(() => {
    toast.success('Preview complete!', {
      description: 'The experience preview has finished.',
    })
    // Optionally close after a delay
    setTimeout(() => onOpenChange(false), 1500)
  }, [onOpenChange])

  // Handle runtime errors
  const handleError = useCallback((err: Error) => {
    toast.error('Preview error', {
      description: err.message,
    })
  }, [])

  return (
    <FullscreenPreviewShell isOpen={open} onClose={handleClose}>
      {/* Loading state */}
      {isLoading && (
        <div className="flex h-full items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Starting preview...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="flex h-full items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Empty steps state */}
      {!isLoading && !error && steps.length === 0 && (
        <div className="flex h-full items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-sm text-muted-foreground">
              No steps to preview. Add some steps first.
            </p>
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Runtime content */}
      {isReady && steps.length > 0 && (
        <ThemeProvider theme={previewTheme}>
          <ExperienceRuntime
            experienceId={experience.id}
            steps={steps}
            session={session}
            onComplete={handleComplete}
            onError={handleError}
          >
            <PreviewRuntimeContent />
          </ExperienceRuntime>
        </ThemeProvider>
      )}
    </FullscreenPreviewShell>
  )
}
