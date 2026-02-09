import type { AspectRatio } from '../types'
import { cn } from '@/shared/utils'

const ASPECT_RATIO_OPTIONS: { value: AspectRatio; label: string }[] = [
  { value: '1:1', label: '1:1' },
  { value: '9:16', label: '9:16' },
  { value: '3:2', label: '3:2' },
  { value: '2:3', label: '2:3' },
]

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
  return (
    <div
      className={cn(
        'flex items-center gap-1 rounded-full bg-black/40 p-1 backdrop-blur-sm',
        className,
      )}
    >
      {ASPECT_RATIO_OPTIONS.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-full px-3 py-1 text-xs font-medium transition-colors',
            value === option.value
              ? 'bg-white text-black'
              : 'text-white/70 hover:text-white',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
