/**
 * PhotoFrame Component
 *
 * Static image equivalent of CameraView's visual layout.
 * Renders a blurred background image + aspect-ratio centered frame,
 * matching CameraView's layered rendering for visual continuity
 * between live camera and captured photo states.
 */

import { ASPECT_RATIO_CSS } from '../constants'
import type { ReactNode } from 'react'
import type { AspectRatio } from '../types'
import { cn } from '@/shared/utils'

interface PhotoFrameProps {
  /** Image source URL (typically a blob URL from CapturedPhoto.previewUrl) */
  src: string
  /** Aspect ratio for the centered frame */
  aspectRatio: AspectRatio
  /** Optional overlay content on top of the image (e.g., upload spinner) */
  overlay?: ReactNode
  /** Alt text for the image */
  alt?: string
  /** Additional CSS classes on the outer container */
  className?: string
}

export function PhotoFrame({
  src,
  aspectRatio,
  overlay,
  alt = 'Photo',
  className,
}: PhotoFrameProps) {
  return (
    <div className={cn('relative bg-gray-700 overflow-hidden', className)}>
      {/* Background layer - blurred image for letterbox area */}
      <img
        src={src}
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl brightness-[0.5]"
      />

      {/* Aspect frame - centered within container, maintains target ratio */}
      <div
        className="absolute inset-0 m-auto overflow-hidden rounded-2xl max-w-2xl"
        style={{
          aspectRatio: ASPECT_RATIO_CSS[aspectRatio],
          width: '100%',
          maxHeight: '100%',
        }}
      >
        {/* Image - fills aspect frame */}
        <img src={src} alt={alt} className="w-full h-full object-cover" />

        {/* Optional overlay (spinner, etc.) */}
        {overlay && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            {overlay}
          </div>
        )}
      </div>
    </div>
  )
}
