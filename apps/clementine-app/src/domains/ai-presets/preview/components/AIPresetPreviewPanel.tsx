/**
 * AIPresetPreviewPanel Container
 *
 * Main preview panel container integrating:
 * - Test input form with dynamic field rendering
 * - Real-time prompt resolution
 * - Input validation
 * - Loading and error states
 *
 * T023: AIPresetPreviewPanel Container
 */

import { Component } from 'react'
import { AlertCircle } from 'lucide-react'
import { useAIPreset } from '../../editor/hooks/useAIPreset'
import { useTestInputs } from '../hooks/useTestInputs'
import { usePromptResolution } from '../hooks/usePromptResolution'
import { usePresetValidation } from '../hooks/usePresetValidation'
import { TestInputsForm } from './TestInputsForm'
import type { ReactNode } from 'react'
import { Skeleton } from '@/ui-kit/ui/skeleton'
import { Alert, AlertDescription } from '@/ui-kit/ui/alert'
import { EditorSection } from '@/shared/editor-controls'

interface AIPresetPreviewPanelProps {
  workspaceId: string
  presetId: string
}

/**
 * Main preview panel for testing AI preset with input values.
 * Provides interactive form for entering test values and seeing
 * how the preset resolves with those inputs.
 *
 * Features:
 * - Dynamic form based on preset variables
 * - Real-time prompt resolution
 * - Input validation with errors and warnings
 * - Loading skeleton while data loads
 * - Error state if preset fails to load
 *
 * @example
 * ```tsx
 * <AIPresetPreviewPanel
 *   workspaceId={workspaceId}
 *   presetId={presetId}
 * />
 * ```
 */
function AIPresetPreviewPanelContent({
  workspaceId,
  presetId,
}: AIPresetPreviewPanelProps) {
  // Fetch preset data with real-time updates
  const {
    data: preset,
    isLoading,
    isError,
    error,
  } = useAIPreset(workspaceId, presetId)

  // Initialize test inputs with default values
  const variables = preset?.draft.variables ?? []
  const mediaRegistry = preset?.draft.mediaRegistry ?? []
  const promptTemplate = preset?.draft.promptTemplate ?? ''

  const { testInputs, updateInput, resetToDefaults } = useTestInputs(variables)

  // Resolve prompt with current test inputs
  const resolvedPrompt = usePromptResolution(
    promptTemplate,
    testInputs,
    variables,
    mediaRegistry,
  )

  // Validate inputs
  const validation = usePresetValidation(variables, testInputs, resolvedPrompt)

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    )
  }

  // Error state
  if (isError || !preset) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertDescription>
          {error instanceof Error && error.message
            ? error.message
            : 'Failed to load preset. Please try again.'}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-0">
      {/* Test Inputs Form */}
      <TestInputsForm
        variables={variables}
        testInputs={testInputs}
        onInputChange={updateInput}
        onReset={resetToDefaults}
      />

      {/* Validation Status (if there are errors or warnings) */}
      {(validation.errors.length > 0 || validation.warnings.length > 0) && (
        <EditorSection title="Validation">
          {/* Errors */}
          {validation.errors.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-destructive">Errors</p>
              <ul className="space-y-1">
                {validation.errors.map((validationError, idx) => (
                  <li key={idx} className="text-sm text-destructive">
                    <span className="font-medium">
                      {validationError.field}:
                    </span>{' '}
                    {validationError.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {validation.warnings.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                Warnings
              </p>
              <ul className="space-y-1">
                {validation.warnings.map((warning, idx) => (
                  <li
                    key={idx}
                    className="text-sm text-orange-600 dark:text-orange-400"
                  >
                    {warning.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </EditorSection>
      )}

      {/* Resolved Prompt Preview (placeholder for Phase 4) */}
      <EditorSection title="Resolved Prompt">
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">
            Prompt preview coming in Phase 4
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Character count: {resolvedPrompt.characterCount}
          </p>
        </div>
      </EditorSection>
    </div>
  )
}

/**
 * Error Boundary for AIPresetPreviewPanel
 */
class PreviewErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>
            Something went wrong loading the preview panel. Please refresh the
            page.
          </AlertDescription>
        </Alert>
      )
    }

    return this.props.children
  }
}

/**
 * AIPresetPreviewPanel with error boundary
 */
export function AIPresetPreviewPanel(props: AIPresetPreviewPanelProps) {
  return (
    <PreviewErrorBoundary>
      <AIPresetPreviewPanelContent {...props} />
    </PreviewErrorBoundary>
  )
}
