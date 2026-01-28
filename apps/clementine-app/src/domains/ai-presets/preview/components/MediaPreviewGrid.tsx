import { memo } from 'react'
import type { MediaReference } from '../types'
import { Card } from '@/ui-kit/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui-kit/ui/tooltip'

type MediaPreviewGridProps = {
  mediaReferences: MediaReference[]
  totalRegistryCount: number
}

function MediaPreviewGridInner({
  mediaReferences,
  totalRegistryCount,
}: MediaPreviewGridProps) {
  // Calculate usage counter
  const usedCount = mediaReferences.length
  const registryUsedCount = mediaReferences.filter(
    (ref) => ref.source === 'registry',
  ).length

  // Empty state
  if (mediaReferences.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center gap-2 text-center text-muted-foreground">
          <p className="text-sm font-medium">No media referenced</p>
          <p className="text-xs">
            Reference images in your prompt using @&#123;ref:name&#125; or
            @&#123;input:name&#125;
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Usage counter */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Media Preview</h3>
        <p className="text-xs text-muted-foreground">
          {registryUsedCount} of {totalRegistryCount} registry items used
          {usedCount > registryUsedCount &&
            ` • ${usedCount - registryUsedCount} test upload${usedCount - registryUsedCount > 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Thumbnail grid - matches MediaRegistrySection style */}
      <div className="grid grid-cols-4 gap-3">
        {mediaReferences.map((media) => (
          <Tooltip key={`${media.type}-${media.name}`}>
            <TooltipTrigger asChild>
              <div className="group relative">
                {/* Thumbnail container - matches MediaRegistryItem */}
                <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
                  <img
                    src={media.url}
                    alt={media.name}
                    loading="lazy"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      const target = e.currentTarget
                      target.src =
                        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f1f5f9" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%2394a3b8" font-size="12"%3EFailed%3C/text%3E%3C/svg%3E'
                    }}
                  />

                  {/* Source indicator badge on hover */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="rounded bg-background/90 px-2 py-1 text-xs font-medium">
                      {media.source === 'registry' ? 'Registry' : 'Test'}
                    </span>
                  </div>
                </div>

                {/* Name label - matches MediaRegistryItem */}
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  @{media.name}
                </p>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                <p className="font-medium">@{media.name}</p>
                <p className="text-xs text-muted-foreground">
                  {media.source === 'registry'
                    ? 'From media registry'
                    : 'Test upload'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Reference: @&#123;{media.type}:{media.name}&#125;
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  )
}

export const MediaPreviewGrid = memo(MediaPreviewGridInner)
