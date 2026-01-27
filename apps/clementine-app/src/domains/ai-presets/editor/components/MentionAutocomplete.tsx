/**
 * MentionAutocomplete Component
 *
 * Portal-based autocomplete for @mentions in prompt template editor.
 * Uses @floating-ui/react for smart positioning with collision detection.
 *
 * Features:
 * - Triggered by @ character
 * - Filters suggestions as user types
 * - Keyboard navigation (up/down arrows, Enter to select, Escape to close)
 * - Color-coded by type (blue for variables, green for media)
 * - Smart positioning (flips/shifts to stay in viewport)
 */
import { useEffect, useRef, useState } from 'react'
import {
  autoUpdate,
  flip,
  offset,
  shift,
  useFloating,
} from '@floating-ui/react'
import { Image, Type } from 'lucide-react'
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
  /** Viewport position for dropdown (fixed positioning) */
  position: { top: number; left: number }
  /** Called when user selects a suggestion */
  onSelect: (suggestion: MentionSuggestion) => void
  /** Called when user closes autocomplete without selection */
  onClose: () => void
}

/**
 * Mention autocomplete dropdown with filtered suggestions
 *
 * Uses React Portal for rendering to avoid container overflow.
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

  // Create virtual element for floating-ui (cursor position)
  const virtualElement = {
    getBoundingClientRect: () => ({
      width: 0,
      height: 0,
      x: position.left,
      y: position.top,
      top: position.top,
      left: position.left,
      right: position.left,
      bottom: position.top,
    }),
  }

  // Setup floating-ui with smart positioning
  const { refs, floatingStyles } = useFloating({
    placement: 'bottom-start',
    middleware: [
      offset(4), // 4px gap from cursor
      flip(), // Flip to top if no space below
      shift({ padding: 8 }), // Shift left/right to stay in viewport (8px margin)
    ],
    whileElementsMounted: autoUpdate, // Update position on scroll/resize
  })

  // Set virtual element as reference
  useEffect(() => {
    refs.setReference(virtualElement)
  }, [position.left, position.top, refs])

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
    if (!listRef.current) return

    const selectedElement = listRef.current.children[selectedIndex]
    if (selectedElement) {
      selectedElement.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      })
    }
  }, [selectedIndex])

  return (
    <div
      ref={refs.setFloating}
      style={floatingStyles}
      className="z-50 w-64 rounded-md border bg-popover shadow-md"
    >
      {filteredSuggestions.length === 0 ? (
        <div className="p-3 text-sm text-muted-foreground">
          No variables or media found
        </div>
      ) : (
        <div ref={listRef} className="max-h-60 overflow-y-auto">
          {filteredSuggestions.map((suggestion, index) => {
            const isSelected = index === selectedIndex
            const Icon = suggestion.type === 'variable' ? Type : Image
            const colorClass =
              suggestion.type === 'variable'
                ? 'text-blue-500'
                : 'text-green-500'

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
                <Icon className={`h-4 w-4 shrink-0 ${colorClass}`} />
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
      )}
    </div>
  )
}
