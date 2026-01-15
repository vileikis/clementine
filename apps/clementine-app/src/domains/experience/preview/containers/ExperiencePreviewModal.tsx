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
import { Loader2, X } from 'lucide-react'
import { toast } from 'sonner'

import { ExperienceRuntime, useRuntime } from '../../runtime'
import { StepRendererRouter } from '../components/StepRendererRouter'
import type { Experience } from '@/domains/experience/shared'
import type { ExperienceStep } from '@/domains/experience/shared/schemas/experience.schema'
import type { Session } from '@/domains/session'
import type { Theme } from '@/shared/theming'
import { useCreateSession, useSubscribeSession } from '@/domains/session'
import { ThemeProvider, themeSchema } from '@/shared/theming'
import { Dialog, DialogContent, DialogTitle } from '@/ui-kit/ui/dialog'
import { Button } from '@/ui-kit/ui/button'
import { cn } from '@/shared/utils'

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
 * Preview session placeholder IDs
 * Used for standalone experience preview without event context
 */
const PREVIEW_PROJECT_ID = '__preview__'
const PREVIEW_EVENT_ID = '__preview__'

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
  // Session state
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Mutations
  const createSession = useCreateSession()

  // Subscribe to session updates
  const { session: subscribedSession } = useSubscribeSession(
    sessionId ? PREVIEW_PROJECT_ID : null,
    sessionId,
  )

  // Sync subscribed session to local state
  useEffect(() => {
    if (subscribedSession) {
      setSession(subscribedSession)
    }
  }, [subscribedSession])

  // Get steps from draft config
  const steps = (experience.draft?.steps ?? [])

  // Theme for preview (using default for now)
  const previewTheme = DEFAULT_PREVIEW_THEME

  // Initialize session when modal opens
  useEffect(() => {
    if (open && !sessionId && !isInitializing) {
      setIsInitializing(true)
      setError(null)

      createSession
        .mutateAsync({
          projectId: PREVIEW_PROJECT_ID,
          workspaceId,
          eventId: PREVIEW_EVENT_ID,
          experienceId: experience.id,
          mode: 'preview',
          configSource: 'draft',
        })
        .then((result) => {
          setSessionId(result.sessionId)
          setSession(result.session)
          setIsInitializing(false)
        })
        .catch((err) => {
          setError(
            err instanceof Error ? err.message : 'Failed to create session',
          )
          setIsInitializing(false)
        })
    }
  }, [
    open,
    sessionId,
    isInitializing,
    createSession,
    workspaceId,
    experience.id,
  ])

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setSessionId(null)
      setSession(null)
      setError(null)
      setIsInitializing(false)
    }
  }, [open])

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
    console.error('Runtime error:', err)
    toast.error('Preview error', {
      description: err.message,
    })
  }, [])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          // Full screen modal for preview
          'max-w-full h-[100dvh] w-screen p-0 rounded-none sm:rounded-none',
          // Remove default max-width
          'sm:max-w-full',
        )}
        showCloseButton={false}
      >
        {/* Hidden title for accessibility */}
        <DialogTitle className="sr-only">
          Preview: {experience.name}
        </DialogTitle>

        {/* Header with close button */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-background/80 backdrop-blur-sm border-b">
          <span className="text-sm font-medium text-muted-foreground">
            Preview Mode
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close preview</span>
          </Button>
        </div>

        {/* Content area */}
        <div className="h-full pt-14">
          {/* Loading state */}
          {isInitializing && (
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Starting preview...
                </p>
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
          {!isInitializing && !error && steps.length === 0 && (
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
          {!isInitializing && !error && session && steps.length > 0 && (
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
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Inner component that uses the runtime hook
 * Must be rendered inside ExperienceRuntime
 */
function PreviewRuntimeContent() {
  const runtime = useRuntime()

  const {
    currentStep,
    canProceed,
    canGoBack,
    next,
    back,
    setAnswer,
    getAnswer,
    isComplete,
  } = runtime

  // Handle answer change
  const handleAnswer = useCallback(
    (value: string | number | boolean | string[]) => {
      if (currentStep) {
        setAnswer(currentStep.id, value)
      }
    },
    [currentStep, setAnswer],
  )

  // Show completion message
  if (isComplete) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <p className="text-lg font-medium">Preview Complete!</p>
          <p className="text-sm text-muted-foreground">
            All steps have been completed.
          </p>
        </div>
      </div>
    )
  }

  // No current step
  if (!currentStep) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">No step to display</p>
      </div>
    )
  }

  // Render current step
  return (
    <StepRendererRouter
      step={currentStep}
      mode="run"
      answer={getAnswer(currentStep.id)}
      onAnswer={handleAnswer}
      onSubmit={next}
      onBack={back}
      canGoBack={canGoBack}
      canProceed={canProceed}
    />
  )
}
