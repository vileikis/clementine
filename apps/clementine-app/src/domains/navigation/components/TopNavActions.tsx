import type { ActionButton } from './TopNavBar'
import { Button } from '@/ui-kit/components/button'

interface TopNavActionsProps {
  actions: ActionButton[]
}

export function TopNavActions({ actions }: TopNavActionsProps) {
  if (actions.length === 0) {
    return <div />
  }

  return (
    <div className="flex items-center gap-2">
      {actions.map((action, index) => {
        const Icon = action.icon
        const isIconOnly = !action.label
        return (
          <Button
            key={index}
            variant={action.variant ?? 'ghost'}
            size={isIconOnly ? 'icon' : 'sm'}
            onClick={action.onClick}
            aria-label={action.ariaLabel ?? action.label}
            className={isIconOnly ? '' : 'gap-2'}
          >
            <Icon className="size-4" />
            {!isIconOnly && (
              <span className="hidden sm:inline">{action.label}</span>
            )}
          </Button>
        )
      })}
    </div>
  )
}
