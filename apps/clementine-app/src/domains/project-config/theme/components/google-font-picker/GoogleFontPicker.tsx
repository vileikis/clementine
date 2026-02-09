/**
 * GoogleFontPicker Component
 *
 * Searchable font picker with live preview using Google Fonts.
 * Uses the reusable Searchable ui-kit component with react-window v2 virtualization.
 */

import { useCallback, useMemo, useState } from 'react'
import { AlertCircle, Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import { useGoogleFontsCatalog } from '../../hooks/useGoogleFontsCatalog'
import { VirtualizedFontRow } from './FontRow'
import {
  DEFAULT_VARIANTS,
  ITEM_HEIGHT,
  SYSTEM_DEFAULT_LABEL,
} from './constants'
import type { GoogleFontEntry } from '../../hooks/useGoogleFontsCatalog'
import type { FontRowProps } from './FontRow'
import {
  Searchable,
  SearchableContent,
  SearchableEmpty,
  SearchableInput,
  SearchableItem,
  SearchableTrigger,
  SearchableVirtualList,
} from '@/ui-kit/ui/searchable'
import { Button } from '@/ui-kit/ui/button'
import { cn } from '@/shared/utils'

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

function clampVariants(
  available: number[],
  desired: number[] = DEFAULT_VARIANTS,
): number[] {
  const clamped = desired.filter((w) => available.includes(w))
  return clamped.length > 0 ? clamped : [available[0] ?? 400]
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
      setSearch('')
      setOpen(false)
    },
    [onChange],
  )

  const handleSelectSystem = useCallback(() => {
    onChange(null)
    setSearch('')
    setOpen(false)
  }, [onChange])

  const displayValue = value ?? SYSTEM_DEFAULT_LABEL

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
      <Searchable open={open} onOpenChange={setOpen}>
        <SearchableTrigger asChild>
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
        </SearchableTrigger>
        <SearchableContent className="w-[280px]" align="start">
          <SearchableInput
            placeholder="Search fonts..."
            value={search}
            onValueChange={setSearch}
          />

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
            <>
              <SearchableItem onSelect={handleSelectSystem}>
                <Check
                  className={cn(
                    'mr-2 size-4',
                    value === null ? 'opacity-100' : 'opacity-0',
                  )}
                />
                {SYSTEM_DEFAULT_LABEL}
              </SearchableItem>

              {filteredFonts.length === 0 && search && (
                <SearchableEmpty>No fonts found.</SearchableEmpty>
              )}

              {filteredFonts.length > 0 && (
                <SearchableVirtualList
                  count={filteredFonts.length}
                  height={ITEM_HEIGHT}
                  rowComponent={VirtualizedFontRow}
                  rowProps={rowProps}
                  onSelectIndex={(i) => handleSelectFont(filteredFonts[i])}
                />
              )}
            </>
          )}
        </SearchableContent>
      </Searchable>
    </div>
  )
}
