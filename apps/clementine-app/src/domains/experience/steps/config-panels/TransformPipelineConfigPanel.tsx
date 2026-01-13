/**
 * Transform Pipeline Config Panel
 *
 * Configuration panel for AI transform steps.
 * Note: No configuration available in MVP.
 */
import { Sparkles } from 'lucide-react'
import type { StepConfigPanelProps } from '../registry/step-registry'

export function TransformPipelineConfigPanel(_props: StepConfigPanelProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Sparkles className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium">AI Transform</h3>
      <p className="text-sm text-muted-foreground">
        No configuration available yet.
      </p>
      <p className="text-xs text-muted-foreground">
        AI pipeline configuration will be added in a future update.
      </p>
    </div>
  )
}
