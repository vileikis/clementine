/**
 * Info Step Renderer
 *
 * Edit-mode renderer for info/display steps.
 * Shows title, description, and media placeholder.
 */
import type { StepRendererProps } from '../registry/step-registry'
import type { InfoStepConfig } from '../schemas/info.schema'

export function InfoStepRenderer({ config }: StepRendererProps) {
  const { title, description, media } = config as InfoStepConfig

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-6 text-center">
      {/* Media placeholder */}
      {media ? (
        <img
          src={media.url}
          alt=""
          className="max-h-48 w-auto rounded-lg object-contain"
        />
      ) : (
        <div className="flex h-32 w-32 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25">
          <span className="text-xs text-muted-foreground">No media</span>
        </div>
      )}

      {/* Title */}
      <h2 className="text-xl font-semibold">
        {title || <span className="text-muted-foreground">Add a title...</span>}
      </h2>

      {/* Description */}
      <p className="max-w-sm text-sm text-muted-foreground">
        {description || 'Add a description...'}
      </p>
    </div>
  )
}
