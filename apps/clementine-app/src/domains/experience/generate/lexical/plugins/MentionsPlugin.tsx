/**
 * MentionsPlugin - Unified Autocomplete for Steps and Media Mentions
 *
 * Provides single typeahead autocomplete for @mentions.
 * Shows steps and media together in one menu.
 *
 * Trigger: @ (shows all options)
 *
 * Features:
 * - Keyboard navigation (Arrow Up/Down, Enter, Escape)
 * - Mouse hover and click selection
 * - Filtered suggestions based on search query
 * - Color-coded menu items by type
 * - Step type icons (📝 for input, 📷 for capture)
 * - Automatic cursor positioning after insertion
 */
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
} from '@lexical/react/LexicalTypeaheadMenuPlugin'
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
} from 'lexical'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { $createMediaMentionNode } from '../nodes/MediaMentionNode'
import { $createStepMentionNode } from '../nodes/StepMentionNode'
import type { MenuTextMatch } from '@lexical/react/LexicalTypeaheadMenuPlugin'
import type { TextNode } from 'lexical'
import type { MediaOption, StepOption } from '../utils/types'

// ============================================================================
// Types
// ============================================================================

type MentionCategory = 'step' | 'media'

class MentionTypeaheadOption extends MenuOption {
  id: string
  name: string
  category: MentionCategory
  stepType?: StepOption['type']

  constructor(
    key: string,
    id: string,
    name: string,
    category: MentionCategory,
    stepType?: StepOption['type'],
  ) {
    super(key)
    this.id = id
    this.name = name
    this.category = category
    this.stepType = stepType
  }
}

// ============================================================================
// Custom Trigger Function
// ============================================================================

/**
 * Custom trigger function that allows spaces in the search query.
 * The default useBasicTypeaheadTriggerMatch closes the menu on space.
 * This version keeps the menu open to search names like "Pet Choice".
 *
 * Pattern: @ followed by alphanumeric characters, spaces, and common punctuation
 * Max length: 50 characters
 */
function useMentionTriggerMatch(): (text: string) => MenuTextMatch | null {
  return useCallback((text: string): MenuTextMatch | null => {
    // Match @ followed by any characters except newline (up to 50 chars)
    // The match includes spaces to allow searching "Pet Choice"
    const match = /(?:^|\s)@([\w\s\-.]{0,50})$/.exec(text)

    if (match === null) {
      return null
    }

    // Check if this is at the start of text or after whitespace
    const matchStart = match.index + (match[0].startsWith('@') ? 0 : 1)

    return {
      leadOffset: matchStart,
      matchingString: match[1],
      replaceableString: match[0].startsWith('@')
        ? match[0]
        : match[0].slice(1),
    }
  }, [])
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get icon for step type
 * 📝 for input steps (text, scale, yes/no, multi-select)
 * 📷 for capture steps (photo)
 */
function getStepTypeIcon(stepType: StepOption['type']): string {
  if (stepType.startsWith('capture.')) {
    return '📷'
  }
  return '📝'
}

/**
 * Get label for step type
 */
function getStepTypeLabel(stepType: StepOption['type']): string {
  switch (stepType) {
    case 'input.scale':
      return 'scale'
    case 'input.yesNo':
      return 'yes/no'
    case 'input.multiSelect':
      return 'multi'
    case 'input.shortText':
      return 'short text'
    case 'input.longText':
      return 'long text'
    case 'capture.photo':
      return 'photo'
    default:
      return 'input'
  }
}

// ============================================================================
// Menu Item Component
// ============================================================================

interface MentionMenuItemProps {
  index: number
  isSelected: boolean
  onClick: () => void
  onMouseEnter: () => void
  option: MentionTypeaheadOption
  setRef: (element: HTMLElement | null) => void
}

function MentionMenuItem({
  isSelected,
  onClick,
  onMouseEnter,
  option,
  setRef,
}: MentionMenuItemProps) {
  // Color coding based on type
  // Blue = steps
  // Green = media
  const bgColor = isSelected ? 'bg-accent' : 'bg-background'

  const isMedia = option.category === 'media'
  const iconColor = isMedia ? 'text-green-600' : 'text-blue-600'

  const icon = isMedia ? '🖼️' : getStepTypeIcon(option.stepType!)

  const typeLabel = isMedia ? 'ref' : getStepTypeLabel(option.stepType!)

  return (
    <li
      ref={setRef}
      tabIndex={-1}
      className={`${bgColor} flex min-h-11 cursor-pointer items-center gap-2 px-3 py-2 transition-colors hover:bg-accent`}
      role="option"
      aria-selected={isSelected}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
    >
      <span className={`text-lg ${iconColor}`}>{icon}</span>
      <span className="flex-1 font-medium">{option.name}</span>
      <span className="text-xs text-muted-foreground">{typeLabel}</span>
    </li>
  )
}

// ============================================================================
// Positioned Menu Component
// ============================================================================

interface PositionedMenuProps {
  anchorElement: HTMLElement
  children: React.ReactNode
}

/**
 * Menu component that positions itself relative to an anchor element
 * Portaled to document.body to escape dialog stacking context
 */
function PositionedMenu({ anchorElement, children }: PositionedMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  useEffect(() => {
    const updatePosition = () => {
      const anchorRect = anchorElement.getBoundingClientRect()
      setPosition({
        top: anchorRect.bottom + window.scrollY + 4, // 4px gap below anchor
        left: anchorRect.left + window.scrollX,
      })
    }

    updatePosition()

    // Update position on scroll/resize
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [anchorElement])

  return (
    <div
      ref={menuRef}
      className="typeahead-popover mentions-menu fixed z-100 w-64 rounded-md border bg-popover p-1 shadow-md"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {children}
    </div>
  )
}

// ============================================================================
// Unified Mentions Plugin
// ============================================================================

export interface MentionsPluginProps {
  steps: StepOption[]
  media: MediaOption[]
}

/**
 * MentionsPlugin
 *
 * Unified autocomplete for steps and media.
 * - Triggered by @
 * - Shows all options in one menu
 * - Steps shown first, then media
 *
 * @example
 * ```tsx
 * <MentionsPlugin
 *   steps={[{ id: '1', name: 'Pet Choice', type: 'input.shortText' }]}
 *   media={[{ id: '2', name: 'summer background.jpeg' }]}
 * />
 * ```
 */
export function MentionsPlugin({ steps, media }: MentionsPluginProps) {
  const [editor] = useLexicalComposerContext()
  const [queryString, setQueryString] = useState<string | null>(null)

  // Custom trigger that allows spaces in search query
  // e.g., "@Pet Choice" will search for items containing "Pet Choice"
  const checkForTrigger = useMentionTriggerMatch()

  // Combine and filter all options based on search query
  const options = useMemo(() => {
    const search = queryString?.toLowerCase() || ''

    // Convert steps to options (filter already excludes info steps from parent)
    const stepOptions = steps
      .filter((s) => s.name.toLowerCase().includes(search))
      .map(
        (s) =>
          new MentionTypeaheadOption(
            `step-${s.id}`,
            s.id,
            s.name,
            'step',
            s.type,
          ),
      )

    // Convert media to options
    const mediaOptions = media
      .filter((m) => m.name.toLowerCase().includes(search))
      .map(
        (m) =>
          new MentionTypeaheadOption(`media-${m.id}`, m.id, m.name, 'media'),
      )

    // Combine: steps first, then media
    return [...stepOptions, ...mediaOptions]
  }, [queryString, steps, media])

  const onSelectOption = useCallback(
    (
      selectedOption: MentionTypeaheadOption,
      nodeToReplace: TextNode | null,
      closeMenu: () => void,
    ) => {
      editor.update(() => {
        let mentionNode

        if (selectedOption.category === 'step') {
          mentionNode = $createStepMentionNode(
            selectedOption.name,
            selectedOption.stepType!,
          )
        } else {
          mentionNode = $createMediaMentionNode(selectedOption.name)
        }

        if (nodeToReplace) {
          nodeToReplace.replace(mentionNode)
        } else {
          // If no node to replace, insert at current selection
          const selection = $getSelection()

          // Only insert nodes if selection is a RangeSelection
          if ($isRangeSelection(selection)) {
            selection.insertNodes([mentionNode])
          } else {
            // For non-range selections, wrap in a paragraph and append to root
            const root = $getRoot()
            const paragraph = $createParagraphNode()
            paragraph.append(mentionNode)
            root.append(paragraph)
          }
        }

        // Add space after mention
        const spaceNode = $createTextNode(' ')
        mentionNode.insertAfter(spaceNode)
        spaceNode.select()

        closeMenu()
      })
    },
    [editor],
  )

  return (
    <LexicalTypeaheadMenuPlugin<MentionTypeaheadOption>
      onQueryChange={setQueryString}
      onSelectOption={onSelectOption}
      triggerFn={checkForTrigger}
      options={options}
      menuRenderFn={(
        anchorElementRef,
        { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex },
      ) => {
        if (!anchorElementRef.current) {
          return null
        }

        // Show empty state when no results match the search
        if (options.length === 0) {
          return createPortal(
            <PositionedMenu anchorElement={anchorElementRef.current}>
              <div className="px-3 py-2 text-sm text-muted-foreground">
                No matching steps or media
              </div>
            </PositionedMenu>,
            document.body,
          )
        }

        return createPortal(
          <PositionedMenu anchorElement={anchorElementRef.current}>
            <ul role="listbox" aria-label="Mentions">
              {options.map((option, index) => (
                <MentionMenuItem
                  key={option.key}
                  index={index}
                  isSelected={selectedIndex === index}
                  onClick={() => {
                    setHighlightedIndex(index)
                    selectOptionAndCleanUp(option)
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  option={option}
                  setRef={option.setRefElement.bind(option)}
                />
              ))}
            </ul>
          </PositionedMenu>,
          document.body,
        )
      }}
    />
  )
}
