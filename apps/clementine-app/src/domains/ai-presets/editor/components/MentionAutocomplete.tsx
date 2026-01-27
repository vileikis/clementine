/**
 * MentionAutocomplete Component
 *
 * Dropdown autocomplete for @mentions in prompt template editor.
 * Displays filtered suggestions for variables and media with keyboard navigation.
 *
 * Features:
 * - Triggered by @ character
 * - Filters suggestions as user types
 * - Keyboard navigation (up/down arrows, Enter to select, Escape to close)
 * - Color-coded by type (blue for variables, green for media)
 * - Positioned at cursor location
 */
import { useEffect, useRef, useState } from 'react'
import { Image, Variable } from 'lucide-react'
import type { PresetMediaEntry, PresetVariable } from '@clementine/shared'

export interface MentionSuggestion {
  type: 'variable' | 'media'
  name: string
  label: string // Display label (for variables) or name (for media)
}

interface MentionAutocompleteProps {
  /** All available variables for @mention suggestions */
  variables: PresetVariable[]
  /** All available media for @mention suggestions */
  media: PresetMediaEntry[]
  /** Search query (text after @) */
  query: string
  /** Cursor position for dropdown placement */
  position: { top: number; left: number }
  /** Called when user selects a suggestion */
  onSelect: (suggestion: MentionSuggestion) => void
  /** Called when user closes autocomplete without selection */
  onClose: () => void
}

/**
 * Mention autocomplete dropdown with filtered suggestions
 *
 * Displays variables and media filtered by query with keyboard navigation.
 * Variables are shown with blue icon, media with green icon.
 *
 * @example
 * ```tsx
 * <MentionAutocomplete
 *   variables={preset.draft.variables}
 *   media={preset.draft.mediaRegistry}
 *   query="sub"
 *   position={{ top: 120, left: 45 }}
 *   onSelect={(suggestion) => insertMention(suggestion)}
 *   onClose={() => setShowAutocomplete(false)}
 * />
 * ```
 */
export function MentionAutocomplete({
  variables,
  media,
  query,
  position,
  onSelect,
  onClose,
}: MentionAutocompleteProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  // Build suggestion list from variables and media
  const suggestions: MentionSuggestion[] = [
    // Add variables
    ...variables.map((variable) => ({
      type: 'variable' as const,
      name: variable.name,
      label: variable.name, // Variables use name as label
    })),
    // Add media
    ...media.map((mediaItem) => ({
      type: 'media' as const,
      name: mediaItem.name,
      label: mediaItem.name, // Media uses name as label
    })),
  ]

  // Filter suggestions by query (case-insensitive)
  const filteredSuggestions = query
    ? suggestions.filter(
        (suggestion) =>
          suggestion.name.toLowerCase().includes(query.toLowerCase()) ||
          suggestion.label.toLowerCase().includes(query.toLowerCase()),
      )
    : suggestions

  // Reset selected index when filtered suggestions change
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // Handle keyboard navigation
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setSelectedIndex((prev) =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0,
        )
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1,
        )
      } else if (event.key === 'Enter') {
        event.preventDefault()
        if (filteredSuggestions[selectedIndex]) {
          onSelect(filteredSuggestions[selectedIndex])
        }
      } else if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [filteredSuggestions, selectedIndex, onSelect, onClose])

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[
        selectedIndex
      ] as HTMLElement
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        })
      }
    }
  }, [selectedIndex])

  // Don't render if no suggestions
  if (filteredSuggestions.length === 0) {
    return (
      <div
        className="absolute z-50 w-64 rounded-md border bg-popover p-3 text-sm text-muted-foreground shadow-md"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
      >
        No variables or media found
      </div>
    )
  }

  return (
    <div
      ref={listRef}
      className="absolute z-50 max-h-60 w-64 overflow-y-auto rounded-md border bg-popover shadow-md"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {filteredSuggestions.map((suggestion, index) => {
        const isSelected = index === selectedIndex
        const Icon = suggestion.type === 'variable' ? Variable : Image
        const colorClass =
          suggestion.type === 'variable' ? 'text-blue-500' : 'text-green-500'

        return (
          <button
            key={`${suggestion.type}-${suggestion.name}`}
            type="button"
            className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${
              isSelected ? 'bg-accent' : ''
            }`}
            onClick={() => onSelect(suggestion)}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <Icon className={`h-4 w-4 flex-shrink-0 ${colorClass}`} />
            <div className="flex-1 truncate">
              <div className="font-medium">{suggestion.name}</div>
              {suggestion.label !== suggestion.name && (
                <div className="text-xs text-muted-foreground">
                  {suggestion.label}
                </div>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
