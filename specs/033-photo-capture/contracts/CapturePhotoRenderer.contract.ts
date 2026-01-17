/**
 * CapturePhotoRenderer Contract
 *
 * This file defines the interface contract for the CapturePhotoRenderer component.
 * The renderer handles both edit mode (placeholder) and run mode (full camera UI).
 *
 * Location: apps/clementine-app/src/domains/experience/steps/renderers/CapturePhotoRenderer.tsx
 */

// =============================================================================
// Imported Types
// =============================================================================

/**
 * Base props for all step renderers.
 * @see apps/clementine-app/src/domains/experience/steps/registry/step-registry.ts
 */
interface StepRendererProps {
  /** The step configuration */
  step: Step
  /** Render mode: 'edit' for designer preview, 'run' for guest execution */
  mode: 'edit' | 'run'
  /** Callback to proceed to next step */
  onSubmit?: () => void
  /** Callback to go back to previous step */
  onBack?: () => void
  /** Whether back navigation is available */
  canGoBack?: boolean
  /** Whether the step input is valid (enables Next button) */
  canProceed?: boolean
  /** Current answer value for input steps */
  answer?: string | number | boolean | string[]
  /** Callback for input step answer changes */
  onAnswer?: (value: string | number | boolean | string[]) => void
}

interface Step {
  id: string
  type: string
  config: unknown
}

/**
 * Configuration for capture photo steps.
 * @see apps/clementine-app/src/domains/experience/steps/schemas/capture-photo.schema.ts
 */
interface CapturePhotoStepConfig {
  aspectRatio: '1:1' | '9:16'
}

// =============================================================================
// Component Props
// =============================================================================

/**
 * Props for CapturePhotoRenderer.
 * Extends standard StepRendererProps with no additional required props.
 */
export interface CapturePhotoRendererProps extends StepRendererProps {
  // Standard StepRendererProps are sufficient
  // Future: optional callbacks for upload customization
}

// =============================================================================
// Render States
// =============================================================================

/**
 * Edit Mode Behavior:
 * - Shows camera placeholder with camera icon
 * - Displays aspect ratio indicator
 * - No camera interaction (preview only)
 * - Uses themed styling from EventThemeProvider
 *
 * Layout:
 * ┌─────────────────────────────────┐
 * │    ┌─────────────────────┐     │
 * │    │      📷 Camera      │     │
 * │    └─────────────────────┘     │
 * │    Aspect Ratio: 1:1           │
 * └─────────────────────────────────┘
 */

/**
 * Run Mode - Permission States:
 *
 * 1. Unknown (loading):
 *    - Show loading indicator while checking permission
 *
 * 2. Undetermined:
 *    - Show prompt to enable camera
 *    - ThemedButton: "Allow Camera"
 *
 * 3. Denied:
 *    - Show message: "Camera access was denied"
 *    - ThemedButton: "Upload a Photo Instead"
 *
 * 4. Unavailable:
 *    - Show message: "No camera detected"
 *    - ThemedButton: "Upload a Photo Instead"
 *
 * 5. Granted:
 *    - Proceed to camera capture states
 */

/**
 * Run Mode - Capture States (after permission granted):
 *
 * 1. Camera Active:
 *    ┌─────────────────────────────────┐
 *    │    ┌─────────────────────┐     │
 *    │    │   [Camera Feed]     │     │
 *    │    └─────────────────────┘     │
 *    │         [Take Photo]            │
 *    └─────────────────────────────────┘
 *
 * 2. Photo Preview:
 *    ┌─────────────────────────────────┐
 *    │    ┌─────────────────────┐     │
 *    │    │  [Captured Photo]   │     │
 *    │    └─────────────────────┘     │
 *    │    [Retake]        [Continue]  │
 *    └─────────────────────────────────┘
 *
 * 3. Uploading:
 *    - Show captured photo with loading overlay
 *    - Disable buttons during upload
 *
 * 4. Error:
 *    - Show error message with recovery options
 *    - [Retry] and/or [Upload Photo] buttons
 */

// =============================================================================
// Component Signature
// =============================================================================

/**
 * Renderer for photo capture steps.
 *
 * @example
 * ```tsx
 * // Used via StepRendererRouter
 * <CapturePhotoRenderer
 *   step={captureStep}
 *   mode="run"
 *   onSubmit={() => runtimeStore.nextStep()}
 *   onBack={() => runtimeStore.previousStep()}
 *   canGoBack={runtimeStore.canGoBack()}
 * />
 * ```
 */
export declare function CapturePhotoRenderer(
  props: CapturePhotoRendererProps,
): JSX.Element

// =============================================================================
// Integration Points
// =============================================================================

/**
 * ARCHITECTURAL DECISION:
 *
 * This renderer builds its own themed UI using ThemedButton, ThemedText, StepLayout.
 * It does NOT reuse these shared/camera components:
 * - PermissionPrompt (hardcoded styling)
 * - PhotoReview (hardcoded styling)
 * - CameraControls (hardcoded styling)
 * - ErrorState (hardcoded styling)
 *
 * Those components remain for the CameraCapture container (used by dev tools).
 *
 * WHAT IS REUSED:
 * - useCameraPermission hook
 * - usePhotoCapture hook
 * - useLibraryPicker hook
 * - CameraView component (video element only)
 * - getDeniedInstructions() utility (extracted to lib/permission-utils.ts)
 */

/**
 * Dependencies:
 * - useCameraPermission: Permission state management (REUSE)
 * - usePhotoCapture: Capture flow orchestration (NEW)
 * - useLibraryPicker: File upload fallback (REUSE)
 * - useExperienceRuntimeStore: Session context for uploads
 * - CameraView: Video element rendering (REUSE)
 * - getDeniedInstructions: Platform-specific instructions (REUSE - extracted)
 * - ThemedButton, ThemedText: Themed UI components
 * - StepLayout: Responsive layout wrapper
 *
 * Side Effects:
 * - Requests camera permission on run mode mount (if undetermined)
 * - Uploads photo to Firebase Storage on confirm
 * - Updates runtime store with captured media
 * - Calls onSubmit after successful capture/upload
 *
 * Error Handling:
 * - Camera errors: Show themed error state with retry/fallback options
 * - Upload errors: Show retry option, preserve captured photo
 * - Permission errors: Show themed fallback to file upload
 */
