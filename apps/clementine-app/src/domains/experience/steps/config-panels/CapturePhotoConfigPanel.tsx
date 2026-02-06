/**
 * Capture Photo Config Panel
 *
 * Configuration panel for photo capture steps.
 * Aspect ratio is synced from the experience outcome (read-only display).
 *
 * @see Feature 065 - Camera capture constrained to experience output aspect ratio
 */
import { Info } from 'lucide-react'
import type { StepConfigPanelProps } from '../registry/step-registry'
import type { AspectRatio } from '@clementine/shared'
import { EditorSection } from '@/shared/editor-controls'

// Aspect ratio display labels
const ASPECT_RATIO_LABELS: Record<AspectRatio, string> = {
  '1:1': 'Square (1:1)',
  '9:16': 'Portrait (9:16)',
  '3:2': 'Landscape (3:2)',
  '2:3': 'Tall Portrait (2:3)',
}

// Aspect ratio descriptions
const ASPECT_RATIO_DESCRIPTIONS: Record<AspectRatio, string> = {
  '1:1': 'Best for profile photos and social media posts',
  '9:16': 'Best for stories and full-screen mobile displays',
  '3:2': 'Best for landscape photos and traditional DSLR-style shots',
  '2:3': 'Best for portrait photos with more vertical space',
}

export function CapturePhotoConfigPanel({
  outcomeAspectRatio,
}: StepConfigPanelProps) {
  // Use outcome aspect ratio (synced from experience output settings)
  const aspectRatio = outcomeAspectRatio ?? '1:1'

  return (
    <div className="space-y-0">
      <EditorSection title="Camera">
        {/* Read-only aspect ratio display - synced from outcome */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Aspect Ratio</span>
            <span className="text-sm text-muted-foreground">
              {ASPECT_RATIO_LABELS[aspectRatio]}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {ASPECT_RATIO_DESCRIPTIONS[aspectRatio]}
          </p>
          <div className="flex items-start gap-2 mt-3 p-2 bg-muted/50 rounded-md">
            <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Camera aspect ratio is automatically synced from the output aspect
              ratio in the Create tab.
            </p>
          </div>
        </div>
      </EditorSection>
    </div>
  )
}
