/**
 * GoogleFontPicker Component
 *
 * Searchable font picker with live preview using Google Fonts.
 * Uses shadcn Popover + Command with react-window v2 virtualization.
 */

import {
  
  
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import { List } from 'react-window'
import { AlertCircle, Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import {
  
  useGoogleFontsCatalog
} from '../hooks/useGoogleFontsCatalog'
import type {GoogleFontEntry} from '../hooks/useGoogleFontsCatalog';
import type {CSSProperties, ReactElement} from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/ui-kit/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/ui-kit/ui/command'
import { Button } from '@/ui-kit/ui/button'
import { cn } from '@/shared/utils'
import { buildGoogleFontsPreviewUrl } from '@/shared/theming/lib/font-css'

export interface GoogleFontSelection {
  family: string
  source: 'google'
  variants: number[]
  category: string
}

export interface GoogleFontPickerProps {
  value: string | null
  onChange: (font: GoogleFontSelection | null) => void
  label?: string
  disabled?: boolean
}

const PREVIEW_TEXT = 'Clementine makes sharing magical.'
const ITEM_HEIGHT = 48
const LIST_HEIGHT = 300
const DEFAULT_VARIANTS = [400, 700]

function clampVariants(
  available: number[],
  desired: number[] = DEFAULT_VARIANTS,
): number[] {
  const clamped = desired.filter((w) => available.includes(w))
  return clamped.length > 0 ? clamped : [available[0] ?? 400]
}

/**
 * Lazily loads a Google Font preview stylesheet when the element becomes visible.
 */
function useLazyFontPreview(family: string) {
  const ref = useRef<HTMLDivElement>(null)
  const [fontLoaded, setFontLoaded] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          const linkId = `gfont-preview-${family.replace(/\s+/g, '-').toLowerCase()}`
          if (!document.getElementById(linkId)) {
            const link = document.createElement('link')
            link.id = linkId
            link.rel = 'stylesheet'
            link.href = buildGoogleFontsPreviewUrl(family, PREVIEW_TEXT)
            document.head.appendChild(link)
          }
          setFontLoaded(true)
          observer.disconnect()
        }
      },
      { threshold: 0 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [family])

  return { ref, fontLoaded }
}

/** Props passed to VirtualizedFontRow via react-window's rowProps */
interface FontRowProps {
  fonts: GoogleFontEntry[]
  selectedFamily: string | null
  onSelectFont: (font: GoogleFontEntry) => void
}

/** react-window v2 row component */
function VirtualizedFontRow({
  index,
  style,
  fonts,
  selectedFamily,
  onSelectFont,
}: {
  index: number
  style: CSSProperties
  ariaAttributes: {
    'aria-posinset': number
    'aria-setsize': number
    role: 'listitem'
  }
} & FontRowProps): ReactElement | null {
  const font = fonts[index]
  if (!font) return null

  return (
    <div style={style}>
      <FontRowContent
        font={font}
        isSelected={selectedFamily === font.family}
        onSelect={() => onSelectFont(font)}
      />
    </div>
  )
}

function FontRowContent({
  font,
  isSelected,
  onSelect,
}: {
  font: GoogleFontEntry
  isSelected: boolean
  onSelect: () => void
}) {
  const { ref, fontLoaded } = useLazyFontPreview(font.family)

  return (
    <div
      ref={ref}
      className={cn(
        'flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded-sm text-sm select-none h-full',
        'hover:bg-accent hover:text-accent-foreground',
        isSelected && 'bg-accent text-accent-foreground',
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

export function GoogleFontPicker({
  value,
  onChange,
  label,
  disabled = false,
}: GoogleFontPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const { fonts, isLoading, error, refetch } = useGoogleFontsCatalog()

  const filteredFonts = useMemo(() => {
    if (!search) return fonts
    const lower = search.toLowerCase()
    return fonts.filter((f) => f.family.toLowerCase().includes(lower))
  }, [fonts, search])

  const handleSelectFont = useCallback(
    (font: GoogleFontEntry) => {
      const variants = clampVariants(font.weights)
      onChange({
        family: font.family,
        source: 'google',
        variants,
        category: font.category,
      })
      setOpen(false)
      setSearch('')
    },
    [onChange],
  )

  const handleSelectSystem = useCallback(() => {
    onChange(null)
    setOpen(false)
    setSearch('')
  }, [onChange])

  const displayValue = value ?? 'System Default'

  const rowProps = useMemo<FontRowProps>(
    () => ({
      fonts: filteredFonts,
      selectedFamily: value,
      onSelectFont: handleSelectFont,
    }),
    [filteredFonts, value, handleSelectFont],
  )

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-xs font-medium text-muted-foreground">
          {label}
        </label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
            disabled={disabled}
          >
            <span className="truncate">{displayValue}</span>
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search fonts..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList className="max-h-none">
              {isLoading && (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Loading fonts...
                </div>
              )}

              {error && (
                <div className="flex flex-col items-center gap-2 py-6 text-sm">
                  <AlertCircle className="size-4 text-destructive" />
                  <span className="text-muted-foreground">
                    Failed to load fonts
                  </span>
                  <button
                    onClick={() => refetch()}
                    className="text-primary text-xs underline"
                  >
                    Retry
                  </button>
                </div>
              )}

              {!isLoading && !error && (
                <CommandGroup>
                  {/* System Default pinned at top */}
                  <CommandItem
                    onSelect={handleSelectSystem}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        'mr-2 size-4',
                        value === null ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    System Default
                  </CommandItem>

                  {/* Virtualized font list */}
                  {filteredFonts.length === 0 && search && (
                    <CommandEmpty>No fonts found.</CommandEmpty>
                  )}
                  {filteredFonts.length > 0 && (
                    <List
                      style={{
                        height: Math.min(
                          LIST_HEIGHT,
                          filteredFonts.length * ITEM_HEIGHT,
                        ),
                      }}
                      rowComponent={VirtualizedFontRow}
                      rowCount={filteredFonts.length}
                      rowHeight={ITEM_HEIGHT}
                      rowProps={rowProps}
                      overscanCount={5}
                    />
                  )}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
