/**
 * SelectOptionCard Component
 *
 * Compact toggle card optimized for narrow ConfigPanel sidebars.
 * Smaller than SharingOptionCard, designed for dense control layouts.
 */
import type { LucideIcon } from 'lucide-react'
import type { IconType } from 'react-icons'
import { Button } from '@/ui-kit/ui/button'
import { cn } from '@/shared/utils/index'

interface SelectOptionCardProps {
  /** Icon to display (Lucide or react-icons) */
  icon: LucideIcon | IconType
  /** Label text */
  label: string
  /** Whether the option is enabled/selected */
  enabled: boolean
  /** Click handler */
  onClick: () => void
  /** Optional className for customization */
  className?: string
}

/**
 * Compact toggle card for ConfigPanel sidebars
 *
 * @example
 * ```tsx
 * <SelectOptionCard
 *   icon={Download}
 *   label="Download"
 *   enabled={formValues.download}
 *   onClick={() => toggleField('download')}
 * />
 * ```
 */
export function SelectOptionCard({
  icon: Icon,
  label,
  enabled,
  onClick,
  className,
}: SelectOptionCardProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className={cn(
        'h-auto w-full cursor-pointer flex-row items-center justify-start gap-2 px-3 py-2 transition-all',
        enabled
          ? 'border-primary bg-primary/10 hover:border-primary/80'
          : 'bg-muted hover:bg-muted/80',
        className,
      )}
      onClick={onClick}
      aria-pressed={enabled}
    >
      <Icon
        className={cn(
          'h-4 w-4 shrink-0 transition-colors',
          enabled ? 'text-primary' : 'text-muted-foreground',
        )}
      />
      <span
        className={cn(
          'text-sm font-medium truncate',
          enabled ? 'text-primary' : 'text-foreground',
        )}
      >
        {label}
      </span>
    </Button>
  )
}
