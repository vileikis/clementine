import { useCallback, useRef } from 'react'
import type { AspectRatio } from '../types'
import { cn } from '@/shared/utils'

const ASPECT_RATIO_OPTIONS: { value: AspectRatio; label: string }[] = [
  { value: '1:1', label: '1:1' },
  { value: '9:16', label: '9:16' },
  { value: '3:2', label: '3:2' },
  { value: '2:3', label: '2:3' },
]

const SWIPE_THRESHOLD = 30

interface AspectRatioControlProps {
  value: AspectRatio
  onChange: (ratio: AspectRatio) => void
  className?: string
}

export function AspectRatioControl({
  value,
  onChange,
  className,
}: AspectRatioControlProps) {
  const touchStartX = useRef(0)
  const hasSwiped = useRef(false)

  const currentIndex = ASPECT_RATIO_OPTIONS.findIndex(
    (opt) => opt.value === value,
  )

  const goToIndex = useCallback(
    (index: number) => {
      const clamped = Math.max(
        0,
        Math.min(index, ASPECT_RATIO_OPTIONS.length - 1),
      )
      if (clamped !== currentIndex) {
        onChange(ASPECT_RATIO_OPTIONS[clamped].value)
      }
    },
    [currentIndex, onChange],
  )

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    hasSwiped.current = false
  }, [])

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (hasSwiped.current) return
      const deltaX = e.touches[0].clientX - touchStartX.current
      if (Math.abs(deltaX) < SWIPE_THRESHOLD) return

      hasSwiped.current = true
      // Swipe left = next, swipe right = previous
      goToIndex(currentIndex + (deltaX < 0 ? 1 : -1))
    },
    [currentIndex, goToIndex],
  )

  return (
    <div
      className={cn(
        'flex items-center gap-1 rounded-full bg-black/40 p-1 backdrop-blur-sm',
        'touch-pan-y select-none',
        className,
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      {ASPECT_RATIO_OPTIONS.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-full px-3 py-1 text-xs font-medium transition-all duration-200',
            value === option.value
              ? 'bg-white text-black scale-110'
              : 'text-white/70 hover:text-white',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
