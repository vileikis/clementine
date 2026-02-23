/**
 * ShareVideoPlayer Component
 *
 * Minimal video player for the share screen with autoplay muted loop,
 * custom play/pause overlay, loading spinner, and error state with retry.
 */

import { useCallback, useRef, useState } from 'react'
import { Loader2, Pause, Play } from 'lucide-react'
import { Button } from '@/ui-kit/ui/button'

export interface ShareVideoPlayerProps {
  /** Video source URL */
  src: string
  /** Poster/thumbnail image URL */
  posterUrl?: string | null
  /** Additional CSS classes */
  className?: string
}

export function ShareVideoPlayer({
  src,
  posterUrl,
  className,
}: ShareVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const togglePlayback = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    if (video.paused) {
      video.play()
      setIsPlaying(true)
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }, [])

  const handleRetry = useCallback(() => {
    setHasError(false)
    setIsLoading(true)
    videoRef.current?.load()
  }, [])

  if (hasError) {
    return (
      <div
        className={`flex max-h-[50vh] w-full flex-col items-center justify-center gap-4 rounded-lg bg-muted p-8 ${className ?? ''}`}
      >
        <p className="text-sm text-muted-foreground">Video failed to load</p>
        <Button variant="outline" size="sm" onClick={handleRetry}>
          Try again
        </Button>
      </div>
    )
  }

  return (
    <div className={`relative ${className ?? ''}`}>
      {/* Video element */}
      <video
        ref={videoRef}
        src={src}
        poster={posterUrl ?? undefined}
        autoPlay
        muted
        loop
        playsInline
        className="max-h-[50vh] w-full rounded-lg object-contain"
        onWaiting={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        onPlaying={() => setIsLoading(false)}
        onError={() => setHasError(true)}
      />

      {/* Loading spinner overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-white drop-shadow-md" />
        </div>
      )}

      {/* Play/Pause overlay */}
      {!isLoading && (
        <button
          type="button"
          className="absolute inset-0 flex cursor-pointer items-center justify-center"
          onClick={togglePlayback}
          aria-label={isPlaying ? 'Pause video' : 'Play video'}
        >
          <div className="rounded-full bg-black/40 p-3 opacity-0 transition-opacity hover:opacity-100">
            {isPlaying ? (
              <Pause className="h-6 w-6 text-white" />
            ) : (
              <Play className="h-6 w-6 text-white" />
            )}
          </div>
        </button>
      )}
    </div>
  )
}
