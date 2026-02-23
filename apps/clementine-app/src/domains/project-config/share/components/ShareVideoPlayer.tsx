/**
 * ShareVideoPlayer Component
 *
 * Minimal video player for the share screen with autoplay muted loop,
 * tap-to-toggle play/pause with a brief status indicator flash,
 * mute/unmute toggle, loading spinner, and error state with retry.
 *
 * Uses a single <video> element with a <canvas> mirror for the blurred
 * background — avoids sync issues from dual video streams.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import * as Sentry from '@sentry/tanstackstart-react'
import { Loader2, Pause, Play, Volume2, VolumeOff } from 'lucide-react'
import { Button } from '@/ui-kit/ui/button'

export interface ShareVideoPlayerProps {
  /** Video source URL */
  src: string
  /** Poster/thumbnail image URL */
  posterUrl?: string | null
  /** Additional CSS classes */
  className?: string
}

/**
 * Continuously draws the video frame onto the canvas at ~30fps.
 * Starts on mount, stops on unmount or when video ends/errors.
 */
function useCanvasMirror(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
) {
  const rafRef = useRef<number>(0)

  useEffect(() => {
    let lastTime = 0
    const interval = 1000 / 30 // ~30fps is enough for a blurred background

    function draw(timestamp: number) {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas) {
        rafRef.current = requestAnimationFrame(draw)
        return
      }
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        rafRef.current = requestAnimationFrame(draw)
        return
      }
      if (timestamp - lastTime >= interval) {
        lastTime = timestamp
        if (video.readyState >= video.HAVE_CURRENT_DATA) {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          ctx.drawImage(video, 0, 0)
        }
      }
      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(rafRef.current)
    }
  }, [videoRef, canvasRef])
}

export function ShareVideoPlayer({
  src,
  posterUrl,
  className,
}: ShareVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  // Incrementing key forces re-mount of the indicator on each toggle,
  // restarting the CSS fade-out animation even on rapid clicks.
  // 0 = no indicator shown yet (initial state).
  const [indicatorKey, setIndicatorKey] = useState(0)

  // Mirror video frames onto the background canvas
  useCanvasMirror(videoRef, canvasRef)

  const togglePlayback = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    if (video.paused) {
      setIsPlaying(true)
      video.play().catch(() => {
        setIsPlaying(false)
      })
    } else {
      video.pause()
      setIsPlaying(false)
    }

    // Bump key to re-mount indicator and restart animation
    setIndicatorKey((k) => k + 1)
  }, [])

  const toggleMute = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    video.muted = !video.muted
    setIsMuted(video.muted)
  }, [])

  const handleRetry = useCallback(() => {
    setHasError(false)
    setIsLoading(true)
    videoRef.current?.load()
  }, [])

  if (hasError) {
    return (
      <div
        className={`flex h-full w-full flex-col items-center justify-center gap-4 rounded-lg bg-black/80 p-8 ${className ?? ''}`}
      >
        <p className="text-sm text-white/70">Video failed to load</p>
        <Button variant="outline" size="sm" onClick={handleRetry}>
          Try again
        </Button>
      </div>
    )
  }

  return (
    <div
      className={`relative h-full w-full overflow-hidden bg-black ${className ?? ''}`}
    >
      {/* Background layer — canvas mirror with blur */}
      <canvas
        ref={canvasRef}
        aria-hidden
        className="absolute inset-0 h-full w-full scale-110 object-cover blur-xl brightness-[0.5]"
      />

      {/* Foreground video — sharp, centered */}
      <video
        ref={videoRef}
        src={src}
        poster={posterUrl ?? undefined}
        autoPlay
        muted
        loop
        playsInline
        className="relative h-full w-full object-contain"
        onWaiting={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        onPlaying={() => setIsLoading(false)}
        onError={(e) => {
          const mediaError = e.currentTarget.error
          Sentry.captureException(
            mediaError ?? new Error('ShareVideoPlayer: video failed to load'),
            { extra: { src } },
          )
          setHasError(true)
        }}
      />

      {/* Loading spinner overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-white drop-shadow-md" />
        </div>
      )}

      {/* Full-area tap/click zone for play/pause */}
      {!isLoading && (
        <button
          type="button"
          className="absolute inset-0 cursor-pointer focus:outline-none"
          onClick={togglePlayback}
          aria-label={isPlaying ? 'Pause video' : 'Play video'}
        />
      )}

      {/* Play/pause status indicator — flashes briefly on toggle */}
      {indicatorKey > 0 && (
        <div
          key={indicatorKey}
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <div className="animate-fade-out rounded-full bg-black/50 p-4">
            {isPlaying ? (
              <Play className="h-8 w-8 text-white" />
            ) : (
              <Pause className="h-8 w-8 text-white" />
            )}
          </div>
        </div>
      )}

      {/* Mute/unmute toggle — bottom right */}
      {!isLoading && (
        <div className="absolute bottom-3 right-3">
          <Button
            variant="ghost"
            size="icon-sm"
            className="rounded-full bg-black/40 text-white hover:bg-black/60 hover:text-white"
            onClick={toggleMute}
            aria-label={isMuted ? 'Unmute video' : 'Mute video'}
          >
            {isMuted ? (
              <VolumeOff className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
