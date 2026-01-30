/**
 * OptionListItem Component
 *
 * Individual option editor with collapsible AI context fields.
 * Used in InputMultiSelectConfigPanel.
 */
import { useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Copy,
  MoreVertical,
  Trash2,
} from 'lucide-react'
import { AIEnabledBadge } from '../../components'
import { PromptFragmentInput } from './PromptFragmentInput'
import { PromptMediaPicker } from './PromptMediaPicker'
import type { MultiSelectOption } from '@clementine/shared'

import { Input } from '@/ui-kit/ui/input'
import { Button } from '@/ui-kit/ui/button'
import { ContextDropdownMenu } from '@/shared/components/ContextDropdownMenu'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/ui-kit/ui/collapsible'

interface OptionListItemProps {
  option: MultiSelectOption
  index: number
  canDelete: boolean
  disabled?: boolean
  onValueChange: (value: string) => void
  onDuplicate: () => void
  onDelete: () => void
  onPromptFragmentChange: (value: string | null) => void
  onPromptMediaChange: (value: MultiSelectOption['promptMedia']) => void
}

export function OptionListItem({
  option,
  index,
  canDelete,
  disabled = false,
  onValueChange,
  onDuplicate,
  onDelete,
  onPromptFragmentChange,
  onPromptMediaChange,
}: OptionListItemProps) {
  // Each option manages its own expanded state
  const [isOpen, setIsOpen] = useState(false)
  const hasAIContext = !!(option.promptFragment || option.promptMedia)

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="border-b border-border last:border-b-0"
    >
      {/* Option value and controls */}
      <div className="flex items-center gap-2 py-3">
        <Input
          value={option.value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={`Option ${index + 1}`}
          maxLength={100}
          disabled={disabled}
          className="flex-1"
        />

        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            title={isOpen ? 'Hide AI fields' : 'Show AI fields'}
          >
            {isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>

        <ContextDropdownMenu
          trigger={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={disabled}
              aria-label="Option actions"
              aria-haspopup="menu"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          }
          actions={[
            {
              key: 'duplicate',
              label: 'Duplicate',
              icon: Copy,
              onClick: onDuplicate,
              disabled,
            },
            {
              key: 'delete',
              label: 'Delete',
              icon: Trash2,
              onClick: onDelete,
              destructive: true,
              disabled: !canDelete || disabled,
            },
          ]}
          aria-label="Option actions"
        />
      </div>

      {/* AI Context indicator when collapsed */}
      {!isOpen && hasAIContext && <AIEnabledBadge />}

      {/* AI Fields (collapsible content) */}
      <CollapsibleContent>
        <div className="space-y-4 pb-3">
          <PromptFragmentInput
            value={option.promptFragment}
            onChange={onPromptFragmentChange}
            disabled={disabled}
          />
          <PromptMediaPicker
            value={option.promptMedia}
            onChange={onPromptMediaChange}
            disabled={disabled}
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
