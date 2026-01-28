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

import { Component, useCallback, useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { useAIPreset } from '../../editor/hooks/useAIPreset'
import { useTestInputs } from '../hooks/useTestInputs'
import { usePromptResolution } from '../hooks/usePromptResolution'
import { usePresetValidation } from '../hooks/usePresetValidation'
import { useMediaReferences } from '../hooks/useMediaReferences'
import { TestInputsForm } from './TestInputsForm'
import { PromptPreview } from './PromptPreview'
import { MediaPreviewGrid } from './MediaPreviewGrid'
import { ValidationDisplay } from './ValidationDisplay'
import { TestGenerationButton } from './TestGenerationButton'
import type { ReactNode } from 'react'
import type { MediaReference } from '@clementine/shared'
import { Skeleton } from '@/ui-kit/ui/skeleton'
import { Alert, AlertDescription } from '@/ui-kit/ui/alert'
import { EditorSection } from '@/shared/editor-controls'
import { useUploadMediaAsset } from '@/domains/media-library/hooks/useUploadMediaAsset'
import { useAuth } from '@/domains/auth/hooks/useAuth'

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
  // Get current user for uploads
  const { user } = useAuth()

  // Track uploading state per variable
  const [uploadingImages, setUploadingImages] = useState<
    Record<string, boolean>
  >({})

  // Handler to scroll to test inputs form when error is clicked
  const handleErrorClick = useCallback(() => {
    // Scroll to top of the form
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

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

  const { testInputs, updateInput, resetToDefaults } = useTestInputs(
    presetId,
    variables,
  )

  // Upload media asset hook
  const { mutateAsync: uploadMedia } = useUploadMediaAsset(
    workspaceId,
    user?.uid,
  )

  // Handle image upload for test inputs
  const handleUploadImage = useCallback(
    async (variableName: string, file: File) => {
      try {
        // Set uploading state
        setUploadingImages((prev) => ({ ...prev, [variableName]: true }))

        // Upload to Firebase Storage (using 'other' type for preset test images)
        const result = await uploadMedia({
          file,
          type: 'other',
          onProgress: (progress) => {
            // Could add progress tracking per variable if needed
            console.log(`Uploading ${variableName}: ${progress}%`)
          },
        })

        // Store MediaReference (serializable to localStorage)
        const mediaRef: MediaReference = {
          mediaAssetId: result.mediaAssetId,
          url: result.url,
          filePath: result.filePath,
        }
        updateInput(variableName, mediaRef)
      } catch (uploadError) {
        console.error('Failed to upload image:', uploadError)
        // Could show toast notification here
      } finally {
        // Clear uploading state
        setUploadingImages((prev) => ({ ...prev, [variableName]: false }))
      }
    },
    [uploadMedia, updateInput],
  )

  // Resolve prompt with current test inputs
  const resolvedPrompt = usePromptResolution(
    promptTemplate,
    testInputs,
    variables,
    mediaRegistry,
  )

  // Validate inputs
  const validation = usePresetValidation(variables, testInputs, resolvedPrompt)

  // Extract media references for preview grid
  const mediaReferences = useMediaReferences(
    promptTemplate,
    testInputs,
    variables,
    mediaRegistry,
  )

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
        onUploadImage={handleUploadImage}
        onReset={resetToDefaults}
        uploadingImages={uploadingImages}
      />

      {/* Validation Display - Always shown */}
      <EditorSection title="Validation">
        <ValidationDisplay
          validation={validation}
          onErrorClick={handleErrorClick}
        />
      </EditorSection>

      {/* Resolved Prompt Preview */}
      <EditorSection title="Resolved Prompt">
        <PromptPreview resolvedPrompt={resolvedPrompt} />
      </EditorSection>

      {/* Media Preview Grid */}
      <EditorSection title="Media">
        <MediaPreviewGrid
          mediaReferences={mediaReferences}
          totalRegistryCount={mediaRegistry.length}
        />
      </EditorSection>

      {/* Test Generation Button */}
      <EditorSection title="Test Generation">
        <TestGenerationButton validation={validation} />
      </EditorSection>
    </div>
  )
}

/**
 * Error Boundary for AIPresetPreviewPanel
 * T073: Error boundary with user-friendly error message and retry button
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

  handleRetry = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p>
                Something went wrong loading the preview panel. Please try again
                or refresh the page.
              </p>
              <button
                type="button"
                onClick={this.handleRetry}
                className="text-sm font-medium underline hover:no-underline"
              >
                Try Again
              </button>
            </div>
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
