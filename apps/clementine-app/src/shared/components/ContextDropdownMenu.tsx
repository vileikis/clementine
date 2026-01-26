/**
 * ContextDropdownMenu Component
 *
 * Reusable dropdown menu for context actions on list items.
 * Enforces consistent styling and separates destructive actions.
 */
'use client'

import type { LucideIcon } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/ui-kit/ui/dropdown-menu'

/**
 * Menu action configuration
 */
export interface MenuAction {
  /** Unique key for the action */
  key: string

  /** Display label */
  label: string

  /** Icon component */
  icon: LucideIcon

  /** Action handler */
  onClick: () => void

  /** Whether this is a destructive action (delete, remove, etc.) */
  destructive?: boolean

  /** Whether the action is disabled */
  disabled?: boolean
}

export interface ContextDropdownMenuProps {
  /** Trigger element for the dropdown */
  trigger: React.ReactNode

  /** Actions to display in the menu */
  actions: MenuAction[]

  /** Accessible label for the menu */
  'aria-label'?: string
}

/**
 * ContextDropdownMenu component
 *
 * Data-driven dropdown menu that:
 * - Auto-separates destructive actions with a separator
 * - Enforces consistent 44px touch targets
 * - Applies destructive styling to dangerous actions
 *
 * @example
 * ```tsx
 * <ContextDropdownMenu
 *   trigger={
 *     <Button variant="ghost" size="icon">
 *       <MoreVertical className="h-4 w-4" />
 *     </Button>
 *   }
 *   actions={[
 *     { key: 'rename', label: 'Rename', icon: Pencil, onClick: handleRename },
 *     { key: 'duplicate', label: 'Duplicate', icon: Copy, onClick: handleDuplicate },
 *     { key: 'delete', label: 'Delete', icon: Trash2, onClick: handleDelete, destructive: true },
 *   ]}
 *   aria-label="Preset actions"
 * />
 * ```
 */
export function ContextDropdownMenu({
  trigger,
  actions,
  'aria-label': ariaLabel,
}: ContextDropdownMenuProps) {
  // Separate destructive from non-destructive actions
  const normalActions = actions.filter((a) => !a.destructive)
  const destructiveActions = actions.filter((a) => a.destructive)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild aria-label={ariaLabel}>
        {trigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        {normalActions.map((action) => (
          <DropdownMenuItem
            key={action.key}
            onClick={action.onClick}
            disabled={action.disabled}
            className="min-h-[44px] cursor-pointer"
          >
            <action.icon className="mr-2 h-4 w-4" />
            {action.label}
          </DropdownMenuItem>
        ))}

        {destructiveActions.length > 0 && normalActions.length > 0 && (
          <DropdownMenuSeparator />
        )}

        {destructiveActions.map((action) => (
          <DropdownMenuItem
            key={action.key}
            onClick={action.onClick}
            disabled={action.disabled}
            className="text-destructive focus:text-destructive min-h-[44px] cursor-pointer"
          >
            <action.icon className="mr-2 h-4 w-4" />
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
