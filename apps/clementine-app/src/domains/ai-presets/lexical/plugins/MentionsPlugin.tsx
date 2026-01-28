/**
 * MentionsPlugin - Unified Autocomplete for All Mentions
 *
 * Provides single typeahead autocomplete for @mentions.
 * Shows variables and media together in one menu.
 *
 * Trigger: @ (shows all options)
 *
 * Features:
 * - Keyboard navigation (Arrow Up/Down, Enter, Escape)
 * - Mouse hover and click selection
 * - Filtered suggestions based on search query
 * - Color-coded menu items by type
 * - Automatic cursor positioning after insertion
 */
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  useBasicTypeaheadTriggerMatch,
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
import { $createMediaMentionNode, $createVariableMentionNode } from '../nodes'
import type { TextNode } from 'lexical'

// ============================================================================
// Types
// ============================================================================

export type VariableOption = {
  id: string
  name: string
  type: 'text' | 'image'
}

export type MediaOption = {
  id: string
  name: string
}

type MentionCategory = 'variable' | 'media'

class MentionTypeaheadOption extends MenuOption {
  id: string
  name: string
  category: MentionCategory
  variableType?: 'text' | 'image'

  constructor(
    key: string,
    id: string,
    name: string,
    category: MentionCategory,
    variableType?: 'text' | 'image',
  ) {
    super(key)
    this.id = id
    this.name = name
    this.category = category
    this.variableType = variableType
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
  // Green = all media (reference media + media input variables)
  // Blue = text variables
  const bgColor = isSelected ? 'bg-accent' : 'bg-background'

  const isMediaType =
    option.category === 'media' || option.variableType === 'image'
  const iconColor = isMediaType ? 'text-green-600' : 'text-blue-600'

  const icon =
    option.category === 'media'
      ? '🖼️'
      : option.variableType === 'text'
        ? '📝'
        : '📸'

  const typeLabel =
    option.category === 'media'
      ? 'ref'
      : option.variableType === 'text'
        ? 'text'
        : 'input'

  return (
    <li
      ref={setRef}
      tabIndex={-1}
      className={`${bgColor} flex cursor-pointer items-center gap-2 px-3 py-2 transition-colors hover:bg-accent`}
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
      className="typeahead-popover mentions-menu fixed z-[100] w-64 rounded-md border bg-popover p-1 shadow-md"
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
  variables: VariableOption[]
  media: MediaOption[]
}

/**
 * MentionsPlugin
 *
 * Unified autocomplete for variables and media.
 * - Triggered by @
 * - Shows all options in one menu
 *
 * @example
 * ```tsx
 * <MentionsPlugin
 *   variables={[{ id: '1', name: 'subject', type: 'text' }]}
 *   media={[{ id: '2', name: 'background' }]}
 * />
 * ```
 */
export function MentionsPlugin({ variables, media }: MentionsPluginProps) {
  const [editor] = useLexicalComposerContext()
  const [queryString, setQueryString] = useState<string | null>(null)

  // Trigger pattern: @ followed by alphanumeric/underscore
  const checkForTrigger = useBasicTypeaheadTriggerMatch('@', {
    minLength: 0,
    maxLength: 50,
  })

  // Combine and filter all options based on search query
  const options = useMemo(() => {
    const search = queryString?.toLowerCase() || ''

    // Convert variables to options
    const variableOptions = variables
      .filter((v) => v.name.toLowerCase().includes(search))
      .map(
        (v) =>
          new MentionTypeaheadOption(
            `var-${v.id}`,
            v.id,
            v.name,
            'variable',
            v.type,
          ),
      )

    // Convert media to options
    const mediaOptions = media
      .filter((m) => m.name.toLowerCase().includes(search))
      .map(
        (m) =>
          new MentionTypeaheadOption(`media-${m.id}`, m.id, m.name, 'media'),
      )

    // Combine and sort: variables first, then media
    return [...variableOptions, ...mediaOptions]
  }, [queryString, variables, media])

  const onSelectOption = useCallback(
    (
      selectedOption: MentionTypeaheadOption,
      nodeToReplace: TextNode | null,
      closeMenu: () => void,
    ) => {
      editor.update(() => {
        let mentionNode

        if (selectedOption.category === 'variable') {
          const varType = selectedOption.variableType ?? 'text'
          mentionNode = $createVariableMentionNode(
            selectedOption.id,
            selectedOption.name,
            varType,
          )
        } else {
          mentionNode = $createMediaMentionNode(
            selectedOption.id,
            selectedOption.name,
          )
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
            // For non-range selections (NodeSelection, GridSelection),
            // wrap in a paragraph and append to root as a safe fallback
            const root = $getRoot()
            const paragraph = $createParagraphNode()
            paragraph.append(mentionNode)
            root.append(mentionNode)
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
        if (!anchorElementRef.current || options.length === 0) {
          return null
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
