'use client'

/**
 * Searchable — A composable, searchable popover with keyboard navigation
 * and optional virtualized list support (react-window v2).
 *
 * Composable sub-components:
 * - Searchable           (root — wraps Popover, provides context)
 * - SearchableTrigger    (trigger button)
 * - SearchableContent    (popover content — attaches keyboard handler)
 * - SearchableInput      (search input with icon)
 * - SearchableItem       (pinned, non-virtualized selectable item)
 * - SearchableVirtualList (react-window v2 virtualized list)
 * - SearchableEmpty      (empty state)
 *
 * Public hook:
 * - useSearchableHighlight (for virtual row components to read highlight state)
 */

import * as React from 'react'
import { SearchIcon } from 'lucide-react'
import { List, useListRef } from 'react-window'
import { Popover, PopoverContent, PopoverTrigger } from '@/ui-kit/ui/popover'
import { cn } from '@/shared/utils/index'

// =============================================================================
// Context
// =============================================================================

interface SearchableContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void

  highlightIndex: number
  setHighlightIndex: React.Dispatch<React.SetStateAction<number>>

  pinnedCount: number
  virtualCount: number
  setVirtualCount: React.Dispatch<React.SetStateAction<number>>

  claimPinnedIndex: () => number
  registerSelectHandler: (index: number, handler: () => void) => void
  unregisterSelectHandler: (index: number) => void
  registerVirtualSelectHandler: (
    handler: ((virtualIndex: number) => void) | null,
  ) => void
  triggerSelect: (globalIndex: number) => void
}

const SearchableContext = React.createContext<SearchableContextValue | null>(
  null,
)

function useSearchableContext() {
  const ctx = React.useContext(SearchableContext)
  if (!ctx) {
    throw new Error('Searchable.* components must be used within <Searchable>')
  }
  return ctx
}

/**
 * Public hook for virtual row components to read highlight state.
 */
export function useSearchableHighlight() {
  const ctx = useSearchableContext()
  return {
    highlightIndex: ctx.highlightIndex,
    pinnedCount: ctx.pinnedCount,
  }
}

// =============================================================================
// Searchable (Root)
// =============================================================================

interface SearchableProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

function Searchable({ open, onOpenChange, children }: SearchableProps) {
  const [highlightIndex, setHighlightIndex] = React.useState(-1)
  const [virtualCount, setVirtualCount] = React.useState(0)
  const [pinnedCount, setPinnedCount] = React.useState(0)

  const pinnedCounter = React.useRef(0)
  const selectHandlers = React.useRef(new Map<number, () => void>())
  const virtualSelectHandler = React.useRef<
    ((virtualIndex: number) => void) | null
  >(null)

  // Reset state when popover opens
  const prevOpen = React.useRef(open)
  React.useEffect(() => {
    if (open && !prevOpen.current) {
      setHighlightIndex(0)
      pinnedCounter.current = 0
      setPinnedCount(0)
      selectHandlers.current.clear()
      virtualSelectHandler.current = null
    }
    prevOpen.current = open
  }, [open])

  const ctxValue = React.useMemo<SearchableContextValue>(
    () => ({
      open,
      onOpenChange,
      highlightIndex,
      setHighlightIndex,
      pinnedCount,
      virtualCount,
      setVirtualCount,
      claimPinnedIndex: () => {
        const index = pinnedCounter.current
        pinnedCounter.current++
        setPinnedCount((c) => c + 1)
        return index
      },
      registerSelectHandler: (index, handler) => {
        selectHandlers.current.set(index, handler)
      },
      unregisterSelectHandler: (index) => {
        selectHandlers.current.delete(index)
      },
      registerVirtualSelectHandler: (handler) => {
        virtualSelectHandler.current = handler
      },
      triggerSelect: (globalIndex) => {
        const pinnedHandler = selectHandlers.current.get(globalIndex)
        if (pinnedHandler) {
          pinnedHandler()
        } else if (virtualSelectHandler.current) {
          virtualSelectHandler.current(globalIndex - pinnedCounter.current)
        }
      },
    }),
    [open, onOpenChange, highlightIndex, pinnedCount, virtualCount],
  )

  return (
    <SearchableContext.Provider value={ctxValue}>
      <Popover open={open} onOpenChange={onOpenChange}>
        {children}
      </Popover>
    </SearchableContext.Provider>
  )
}

// =============================================================================
// SearchableTrigger
// =============================================================================

function SearchableTrigger({
  ...props
}: React.ComponentProps<typeof PopoverTrigger>) {
  return <PopoverTrigger data-slot="searchable-trigger" {...props} />
}

// =============================================================================
// SearchableContent
// =============================================================================

function SearchableContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof PopoverContent>) {
  const ctx = useSearchableContext()

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      const totalCount = ctx.pinnedCount + ctx.virtualCount
      if (totalCount === 0) return

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault()
          ctx.setHighlightIndex((prev) => Math.min(prev + 1, totalCount - 1))
          break
        }
        case 'ArrowUp': {
          e.preventDefault()
          ctx.setHighlightIndex((prev) => Math.max(prev - 1, 0))
          break
        }
        case 'Enter': {
          e.preventDefault()
          if (ctx.highlightIndex >= 0) {
            ctx.triggerSelect(ctx.highlightIndex)
          }
          break
        }
        case 'Home': {
          e.preventDefault()
          ctx.setHighlightIndex(0)
          break
        }
        case 'End': {
          e.preventDefault()
          ctx.setHighlightIndex(totalCount - 1)
          break
        }
      }
    },
    [ctx],
  )

  return (
    <PopoverContent
      data-slot="searchable-content"
      className={cn('flex flex-col overflow-hidden p-0', className)}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {children}
    </PopoverContent>
  )
}

// =============================================================================
// SearchableInput
// =============================================================================

interface SearchableInputProps {
  placeholder?: string
  value: string
  onValueChange: (value: string) => void
  className?: string
}

function SearchableInput({
  placeholder,
  value,
  onValueChange,
  className,
}: SearchableInputProps) {
  const ctx = useSearchableContext()
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Auto-focus on mount (popover open)
  React.useEffect(() => {
    const timer = requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
    return () => cancelAnimationFrame(timer)
  }, [])

  return (
    <div
      data-slot="searchable-input-wrapper"
      className="flex h-9 items-center gap-2 border-b px-3"
    >
      <SearchIcon className="size-4 shrink-0 opacity-50" />
      <input
        ref={inputRef}
        data-slot="searchable-input"
        className={cn(
          'placeholder:text-muted-foreground flex h-10 w-full bg-transparent py-3 text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onValueChange(e.target.value)
          ctx.setHighlightIndex(0)
        }}
      />
    </div>
  )
}

// =============================================================================
// SearchableItem (pinned, non-virtualized)
// =============================================================================

interface SearchableItemProps {
  onSelect: () => void
  className?: string
  children: React.ReactNode
  disabled?: boolean
}

function SearchableItem({
  onSelect,
  className,
  children,
  disabled = false,
}: SearchableItemProps) {
  const ctx = useSearchableContext()

  // Claim a stable index on mount (before paint)
  const indexRef = React.useRef<number | null>(null)
  React.useLayoutEffect(() => {
    if (indexRef.current === null) {
      indexRef.current = ctx.claimPinnedIndex()
    }
  }, [ctx])

  const index = indexRef.current ?? -1

  // Register select handler
  React.useEffect(() => {
    if (index === -1) return // Skip until index is claimed

    const handler = () => {
      if (!disabled) {
        onSelect()
        ctx.onOpenChange(false)
      }
    }
    ctx.registerSelectHandler(index, handler)
    return () => ctx.unregisterSelectHandler(index)
  }, [ctx, index, onSelect, disabled])

  const isHighlighted = index !== -1 && ctx.highlightIndex === index

  return (
    <div
      data-slot="searchable-item"
      data-highlighted={isHighlighted || undefined}
      data-disabled={disabled || undefined}
      role="option"
      aria-selected={isHighlighted}
      className={cn(
        'relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none',
        'data-highlighted:bg-accent data-highlighted:text-accent-foreground',
        'data-disabled:pointer-events-none data-disabled:opacity-50',
        className,
      )}
      onClick={() => {
        if (!disabled && index !== -1) {
          onSelect()
          ctx.onOpenChange(false)
        }
      }}
      onMouseEnter={() => {
        if (index !== -1) {
          ctx.setHighlightIndex(index)
        }
      }}
    >
      {children}
    </div>
  )
}

// =============================================================================
// SearchableVirtualList
// =============================================================================

interface SearchableVirtualListProps<TRowProps extends object> {
  /** Number of items */
  count: number
  /** Row height in pixels */
  height: number
  /** react-window v2 row component */
  rowComponent: React.ComponentType<
    {
      index: number
      style: React.CSSProperties
      ariaAttributes: {
        'aria-posinset': number
        'aria-setsize': number
        role: 'listitem'
      }
    } & TRowProps
  >
  /** Additional props passed to each row */
  rowProps: TRowProps
  /** Called when Enter key selects a virtual row */
  onSelectIndex?: (index: number) => void
  /** Max visible height (default: 300) */
  maxHeight?: number
  /** Overscan rows (default: 5) */
  overscanCount?: number
  className?: string
}

function SearchableVirtualList<TRowProps extends object>({
  count,
  height: rowHeight,
  rowComponent,
  rowProps,
  onSelectIndex,
  maxHeight = 300,
  overscanCount = 5,
  className,
}: SearchableVirtualListProps<TRowProps>) {
  const ctx = useSearchableContext()
  const listRef = useListRef(null)

  // Register virtual count
  React.useEffect(() => {
    ctx.setVirtualCount(count)
    return () => ctx.setVirtualCount(0)
  }, [count, ctx])

  // Register virtual select handler
  React.useEffect(() => {
    if (onSelectIndex) {
      ctx.registerVirtualSelectHandler((virtualIndex) => {
        onSelectIndex(virtualIndex)
        ctx.onOpenChange(false)
      })
    }
    return () => ctx.registerVirtualSelectHandler(null)
  }, [onSelectIndex, ctx])

  // Scroll to highlighted virtual row
  React.useEffect(() => {
    const virtualIndex = ctx.highlightIndex - ctx.pinnedCount
    if (virtualIndex >= 0 && virtualIndex < count) {
      listRef.current?.scrollToRow({
        index: virtualIndex,
        align: 'smart',
      })
    }
  }, [ctx.highlightIndex, ctx.pinnedCount, count, listRef])

  if (count === 0) return null

  return (
    <div data-slot="searchable-virtual-list" className={className}>
      <List
        listRef={listRef}
        rowComponent={
          rowComponent as Parameters<typeof List>[0]['rowComponent']
        }
        rowCount={count}
        rowHeight={rowHeight}
        rowProps={rowProps as Parameters<typeof List>[0]['rowProps']}
        overscanCount={overscanCount}
        style={{
          height: Math.min(maxHeight, count * rowHeight),
        }}
      />
    </div>
  )
}

// =============================================================================
// SearchableEmpty
// =============================================================================

interface SearchableEmptyProps {
  className?: string
  children: React.ReactNode
}

function SearchableEmpty({ className, children }: SearchableEmptyProps) {
  return (
    <div
      data-slot="searchable-empty"
      className={cn('py-6 text-center text-sm', className)}
    >
      {children}
    </div>
  )
}

// =============================================================================
// Exports
// =============================================================================

export {
  Searchable,
  SearchableTrigger,
  SearchableContent,
  SearchableInput,
  SearchableItem,
  SearchableVirtualList,
  SearchableEmpty,
}

export type {
  SearchableProps,
  SearchableInputProps,
  SearchableItemProps,
  SearchableVirtualListProps,
  SearchableEmptyProps,
}
