/**
 * Transform Pipeline Renderer
 *
 * Edit-mode renderer for AI transform steps.
 * Shows "AI Processing" placeholder with "Coming soon" badge.
 */
import { Sparkles } from 'lucide-react'
import type { StepRendererProps } from '../registry/step-registry'
import { Badge } from '@/ui-kit/ui/badge'

export function TransformPipelineRenderer(_props: StepRendererProps) {
  return (
    <div className="flex flex-col items-center gap-4 p-6">
      {/* Icon */}
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted">
        <Sparkles className="h-10 w-10 text-muted-foreground" />
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold">AI Processing</h3>

      {/* Badge */}
      <Badge variant="secondary">Coming soon</Badge>

      {/* Description */}
      <p className="max-w-sm text-center text-sm text-muted-foreground">
        AI transformation will process your captured media using the configured
        pipeline.
      </p>
    </div>
  )
}
