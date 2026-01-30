/**
 * OptionListItem Component
 *
 * Individual option editor with collapsible AI context fields.
 * Used in InputMultiSelectConfigPanel.
 */
import {
  ChevronDown,
  ChevronUp,
  Copy,
  MoreVertical,
  Trash2,
} from 'lucide-react'
import { PromptFragmentInput } from './PromptFragmentInput'
import { PromptMediaPicker } from './PromptMediaPicker'
import type { MultiSelectOption } from '@clementine/shared'

import { Input } from '@/ui-kit/ui/input'
import { Button } from '@/ui-kit/ui/button'
import { ContextDropdownMenu } from '@/shared/components/ContextDropdownMenu'

interface OptionListItemProps {
  option: MultiSelectOption
  index: number
  isExpanded: boolean
  canDelete: boolean
  disabled?: boolean
  onValueChange: (value: string) => void
  onToggleExpanded: () => void
  onDuplicate: () => void
  onDelete: () => void
  onPromptFragmentChange: (value: string | undefined) => void
  onPromptMediaChange: (value: MultiSelectOption['promptMedia']) => void
}

export function OptionListItem({
  option,
  index,
  isExpanded,
  canDelete,
  disabled = false,
  onValueChange,
  onToggleExpanded,
  onDuplicate,
  onDelete,
  onPromptFragmentChange,
  onPromptMediaChange,
}: OptionListItemProps) {
  const hasAIContext = !!(option.promptFragment || option.promptMedia)

  return (
    <div className="border-b border-border last:border-b-0">
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

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onToggleExpanded}
          disabled={disabled}
          title={isExpanded ? 'Hide AI fields' : 'Show AI fields'}
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>

        <ContextDropdownMenu
          trigger={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={disabled}
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
      {!isExpanded && hasAIContext && (
        <div className="pb-3 text-xs text-muted-foreground">
          ✨ AI context added
        </div>
      )}

      {/* AI Fields (expanded) */}
      {isExpanded && (
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
      )}
    </div>
  )
}
