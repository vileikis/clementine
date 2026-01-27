/**
 * ContextDropdownMenu Component
 *
 * Reusable dropdown menu for context actions on list items.
 * Supports simple flat actions or grouped sections with separators.
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

/**
 * Menu section configuration
 */
export interface MenuSection {
  /** Optional label for the section (for future use) */
  label?: string

  /** Actions in this section */
  items: MenuAction[]
}

export interface ContextDropdownMenuProps {
  /** Trigger element for the dropdown */
  trigger: React.ReactNode

  /** Simple flat list of actions (use for single section) */
  actions?: MenuAction[]

  /** Grouped sections with separators between them */
  sections?: MenuSection[]

  /** Accessible label for the menu */
  'aria-label'?: string
}

/**
 * ContextDropdownMenu component
 *
 * Data-driven dropdown menu that supports:
 * - Simple flat actions array (single section)
 * - Grouped sections with automatic separators between them
 * - Destructive action styling
 * - 44px touch targets for accessibility
 *
 * @example Simple usage
 * ```tsx
 * <ContextDropdownMenu
 *   trigger={<Button variant="ghost" size="icon"><MoreVertical /></Button>}
 *   actions={[
 *     { key: 'rename', label: 'Rename', icon: Pencil, onClick: handleRename },
 *     { key: 'delete', label: 'Delete', icon: Trash2, onClick: handleDelete, destructive: true },
 *   ]}
 * />
 * ```
 *
 * @example Grouped sections
 * ```tsx
 * <ContextDropdownMenu
 *   trigger={<Button variant="ghost" size="icon"><MoreVertical /></Button>}
 *   sections={[
 *     { items: [
 *       { key: 'rename', label: 'Rename', icon: Pencil, onClick: handleRename },
 *       { key: 'duplicate', label: 'Duplicate', icon: Copy, onClick: handleDuplicate },
 *     ]},
 *     { items: [
 *       { key: 'archive', label: 'Archive', icon: Archive, onClick: handleArchive },
 *     ]},
 *     { items: [
 *       { key: 'delete', label: 'Delete', icon: Trash2, onClick: handleDelete, destructive: true },
 *     ]},
 *   ]}
 * />
 * ```
 */
export function ContextDropdownMenu({
  trigger,
  actions,
  sections,
  'aria-label': ariaLabel,
}: ContextDropdownMenuProps) {
  // Convert simple actions to sections format
  const resolvedSections: MenuSection[] =
    sections ?? (actions ? [{ items: actions }] : [])

  // Filter out empty sections
  const nonEmptySections = resolvedSections.filter(
    (section) => section.items.length > 0,
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild aria-label={ariaLabel}>
        {trigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        {nonEmptySections.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            {/* Separator between sections (not before first) */}
            {sectionIndex > 0 && <DropdownMenuSeparator />}

            {/* Section items */}
            {section.items.map((action) => (
              <DropdownMenuItem
                key={action.key}
                onClick={action.onClick}
                disabled={action.disabled}
                className={
                  action.destructive
                    ? 'text-destructive focus:text-destructive min-h-[44px] cursor-pointer'
                    : 'min-h-[44px] cursor-pointer'
                }
              >
                <action.icon className="mr-2 h-4 w-4" />
                {action.label}
              </DropdownMenuItem>
            ))}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
