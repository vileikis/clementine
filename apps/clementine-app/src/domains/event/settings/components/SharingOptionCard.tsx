import type { LucideIcon } from 'lucide-react'
import type { IconType } from 'react-icons'
import { Button } from '@/ui-kit/ui/button'
import { cn } from '@/shared/utils/index'

interface SharingOptionCardProps {
  icon: LucideIcon | IconType
  label: string
  enabled: boolean
  onClick: () => void
}

export function SharingOptionCard({
  icon: Icon,
  label,
  enabled,
  onClick,
}: SharingOptionCardProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className={cn(
        'h-auto w-32 sm:w-40 md:w-48 cursor-pointer flex-col items-center gap-2 p-3 sm:p-4 transition-all',
        enabled
          ? 'border-blue-500 bg-blue-50 dark:border-blue-700 dark:bg-blue-950 hover:bg-blue-50 dark:hover:bg-blue-950 hover:border-blue-600 hover:shadow-sm'
          : 'bg-muted hover:bg-muted/80 hover:shadow-sm',
      )}
      onClick={onClick}
      aria-pressed={enabled}
    >
      <Icon
        className={cn(
          'h-8 w-8 sm:h-10 sm:w-10 transition-colors',
          enabled
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-muted-foreground',
        )}
      />
      <span className="font-medium text-center text-sm sm:text-base">
        {label}
      </span>
    </Button>
  )
}
