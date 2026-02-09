# Contract: GoogleFontPicker Component

**Feature**: 066-google-fonts
**Location**: `apps/clementine-app/src/domains/project-config/theme/components/GoogleFontPicker.tsx`

## Component Interface

```typescript
interface GoogleFontPickerProps {
  /** Currently selected font family name, or null for System Default */
  value: string | null
  /** Called when user selects a font. null = System Default. */
  onChange: (font: GoogleFontSelection | null) => void
  /** Label for the field */
  label?: string
  /** Disable interaction */
  disabled?: boolean
}

interface GoogleFontSelection {
  /** Font family name (e.g., "Inter") */
  family: string
  /** Font source */
  source: 'google'
  /** Available weights for this font, clamped to [400, 700] default */
  variants: number[]
  /** Font category for fallback purposes */
  category: string
}
```

## Behavior

1. **Trigger**: Renders as a button showing the current font name (or "System Default"). Clicking opens a popover.
2. **Popover content**:
   - Search input at top (filters by font family name, case-insensitive)
   - "System Default" option pinned at top of list
   - Virtualized scrollable list of Google Fonts (~1600 entries)
   - Each row shows font name rendered in its own typeface + preview sentence
3. **Font preview loading**: Fonts load lazily as rows become visible (intersection observer + `text=` parameter for minimal download)
4. **Selection**: Clicking a font row calls `onChange` with font metadata. Popover closes.
5. **System Default**: Clicking "System Default" calls `onChange(null)`. Popover closes.

## Integration Point

Replaces the current `SelectField` for font in `ThemeConfigPanel.tsx`:

```typescript
// Before (current):
<SelectField
  label="Font"
  value={theme.fontFamily ?? 'system'}
  onChange={(value) => onUpdate({ fontFamily: value === 'system' ? null : value })}
  options={FONT_OPTIONS}
/>

// After (new):
<GoogleFontPicker
  label="Font"
  value={theme.fontFamily}
  onChange={(selection) => {
    if (selection === null) {
      onUpdate({ fontFamily: null, fontSource: 'system', fontVariants: [400, 700] })
    } else {
      onUpdate({
        fontFamily: selection.family,
        fontSource: selection.source,
        fontVariants: selection.variants,
      })
    }
  }}
/>
```

## Dependencies

- `shadcn/ui`: Popover, Command (cmdk)
- Virtualization: `react-window` (FixedSizeList) or equivalent
- Font catalog: `useGoogleFontsCatalog` hook (TanStack Query + Google Fonts API)

## Loading & Error States

- **Loading**: While font catalog is being fetched, show a loading spinner in the popover
- **Error**: If API fails, show an error message with retry button. "System Default" remains selectable.
- **Empty search**: Show "No fonts found" message
