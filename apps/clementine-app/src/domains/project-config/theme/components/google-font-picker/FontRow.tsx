import { Check } from 'lucide-react'
import { useLazyFontPreview } from './useLazyFontPreview'
import { PREVIEW_TEXT } from './constants'
import type { CSSProperties, ReactElement } from 'react'
import type { GoogleFontEntry } from '../../hooks/useGoogleFontsCatalog'
import { useSearchableHighlight } from '@/ui-kit/ui/searchable'
import { cn } from '@/shared/utils'

/** Props passed to VirtualizedFontRow via react-window's rowProps */
export interface FontRowProps {
  fonts: GoogleFontEntry[]
  selectedFamily: string | null
  onSelectFont: (font: GoogleFontEntry) => void
}

/** Props injected by react-window v2 */
interface VirtualizedRowInjectedProps {
  index: number
  style: CSSProperties
  ariaAttributes: {
    'aria-posinset': number
    'aria-setsize': number
    role: 'listitem'
  }
}

export type VirtualizedFontRowProps = VirtualizedRowInjectedProps & FontRowProps

/** react-window v2 row component with keyboard highlight support */
export function VirtualizedFontRow({
  index,
  style,
  fonts,
  selectedFamily,
  onSelectFont,
}: VirtualizedFontRowProps): ReactElement | null {
  // Hook must be called unconditionally before any early returns
  const { highlightIndex, pinnedCount } = useSearchableHighlight()

  const font = fonts[index]
  if (!font) return null

  const isHighlighted = highlightIndex === pinnedCount + index

  return (
    <div style={style}>
      <FontRowContent
        font={font}
        isSelected={selectedFamily === font.family}
        isHighlighted={isHighlighted}
        onSelect={() => onSelectFont(font)}
      />
    </div>
  )
}

interface FontRowContentProps {
  font: GoogleFontEntry
  isSelected: boolean
  isHighlighted: boolean
  onSelect: () => void
}

function FontRowContent({
  font,
  isSelected,
  isHighlighted,
  onSelect,
}: FontRowContentProps) {
  const { ref, fontLoaded } = useLazyFontPreview(font.family)

  return (
    <div
      ref={ref}
      className={cn(
        'flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded-sm text-sm select-none h-full',
        'hover:bg-accent hover:text-accent-foreground',
        isSelected && 'bg-accent/50',
        isHighlighted && 'bg-accent text-accent-foreground',
      )}
      onClick={onSelect}
      role="option"
      aria-selected={isSelected}
    >
      <Check
        className={cn(
          'size-4 shrink-0',
          isSelected ? 'opacity-100' : 'opacity-0',
        )}
      />
      <div className="flex flex-col min-w-0 flex-1">
        <span
          className="truncate"
          style={{
            fontFamily: fontLoaded ? `"${font.family}"` : undefined,
          }}
        >
          {font.family}
        </span>
        <span
          className="text-xs text-muted-foreground truncate"
          style={{
            fontFamily: fontLoaded ? `"${font.family}"` : undefined,
          }}
        >
          {PREVIEW_TEXT}
        </span>
      </div>
    </div>
  )
}
