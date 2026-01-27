/**
 * MentionsPlugin - Autocomplete for Variable and Media Mentions
 *
 * Provides typeahead autocomplete for @mentions using LexicalTypeaheadMenuPlugin.
 * Supports two trigger patterns:
 * - Variables: { triggers variable autocomplete
 * - Media: @ triggers media autocomplete
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
import { $createTextNode, TextNode } from 'lexical'
import { useCallback, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  $createMediaMentionNode,
  $createVariableMentionNode,
} from '../nodes'

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

type MentionType = 'variable' | 'media'

class MentionTypeaheadOption extends MenuOption {
  id: string
  name: string
  type: MentionType
  variableType?: 'text' | 'image'

  constructor(
    key: string,
    id: string,
    name: string,
    type: MentionType,
    variableType?: 'text' | 'image',
  ) {
    super(key)
    this.id = id
    this.name = name
    this.type = type
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
  const bgColor = isSelected ? 'bg-accent' : 'bg-background'
  const iconColor =
    option.type === 'media'
      ? 'text-purple-600'
      : option.variableType === 'text'
        ? 'text-blue-600'
        : 'text-green-600'

  const icon =
    option.type === 'media'
      ? '🖼️'
      : option.variableType === 'text'
        ? '📝'
        : '🖼️'

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
      {option.type === 'variable' && (
        <span className="text-xs text-muted-foreground">
          {option.variableType}
        </span>
      )}
    </li>
  )
}

// ============================================================================
// Variable Mentions Plugin
// ============================================================================

interface VariableMentionsPluginProps {
  variables: VariableOption[]
}

function VariableMentionsPlugin({ variables }: VariableMentionsPluginProps) {
  const [editor] = useLexicalComposerContext()
  const [queryString, setQueryString] = useState<string | null>(null)

  // Trigger pattern: { followed by alphanumeric/underscore
  const checkForVariableTrigger = useBasicTypeaheadTriggerMatch('{', {
    minLength: 0,
    maxLength: 50,
  })

  // Filter variables based on search query
  const options = useMemo(() => {
    if (!variables.length) return []

    const search = queryString?.toLowerCase() || ''
    return variables
      .filter((v) => v.name.toLowerCase().includes(search))
      .map(
        (v) =>
          new MentionTypeaheadOption(v.id, v.id, v.name, 'variable', v.type),
      )
  }, [queryString, variables])

  const onSelectOption = useCallback(
    (
      selectedOption: MentionTypeaheadOption,
      nodeToReplace: TextNode | null,
      closeMenu: () => void,
    ) => {
      editor.update(() => {
        const mentionNode = $createVariableMentionNode(
          selectedOption.id,
          selectedOption.name,
          selectedOption.variableType!,
        )

        if (nodeToReplace) {
          nodeToReplace.replace(mentionNode)
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
      triggerFn={checkForVariableTrigger}
      options={options}
      menuRenderFn={(
        anchorElementRef,
        { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex },
      ) => {
        if (!anchorElementRef.current || options.length === 0) {
          return null
        }

        return createPortal(
          <div className="typeahead-popover mentions-menu z-50 w-64 rounded-md border bg-popover p-1 shadow-md">
            <ul role="listbox" aria-label="Variable suggestions">
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
          </div>,
          anchorElementRef.current,
        )
      }}
    />
  )
}

// ============================================================================
// Media Mentions Plugin
// ============================================================================

interface MediaMentionsPluginProps {
  media: MediaOption[]
}

function MediaMentionsPlugin({ media }: MediaMentionsPluginProps) {
  const [editor] = useLexicalComposerContext()
  const [queryString, setQueryString] = useState<string | null>(null)

  // Trigger pattern: @ followed by alphanumeric/underscore
  const checkForMediaTrigger = useBasicTypeaheadTriggerMatch('@', {
    minLength: 0,
    maxLength: 50,
  })

  // Filter media based on search query
  const options = useMemo(() => {
    if (!media.length) return []

    const search = queryString?.toLowerCase() || ''
    return media
      .filter((m) => m.name.toLowerCase().includes(search))
      .map((m) => new MentionTypeaheadOption(m.id, m.id, m.name, 'media'))
  }, [queryString, media])

  const onSelectOption = useCallback(
    (
      selectedOption: MentionTypeaheadOption,
      nodeToReplace: TextNode | null,
      closeMenu: () => void,
    ) => {
      editor.update(() => {
        const mentionNode = $createMediaMentionNode(
          selectedOption.id,
          selectedOption.name,
        )

        if (nodeToReplace) {
          nodeToReplace.replace(mentionNode)
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
      triggerFn={checkForMediaTrigger}
      options={options}
      menuRenderFn={(
        anchorElementRef,
        { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex },
      ) => {
        if (!anchorElementRef.current || options.length === 0) {
          return null
        }

        return createPortal(
          <div className="typeahead-popover mentions-menu z-50 w-64 rounded-md border bg-popover p-1 shadow-md">
            <ul role="listbox" aria-label="Media suggestions">
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
          </div>,
          anchorElementRef.current,
        )
      }}
    />
  )
}

// ============================================================================
// Combined Mentions Plugin
// ============================================================================

export interface MentionsPluginProps {
  variables: VariableOption[]
  media: MediaOption[]
}

/**
 * MentionsPlugin
 *
 * Combines variable and media autocomplete plugins.
 * - Variables triggered by {
 * - Media triggered by @
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
  return (
    <>
      <VariableMentionsPlugin variables={variables} />
      <MediaMentionsPlugin media={media} />
    </>
  )
}
