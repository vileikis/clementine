/**
 * ConnectExperienceDrawer Component
 *
 * Slide-over drawer for selecting experiences to connect to an event slot.
 * Features search, profile filtering, and create new experience button.
 */
import { useMemo, useState } from 'react'
import { ExternalLink, Loader2, Plus, Search } from 'lucide-react'
import { usePaginatedExperiencesForSlot } from '../hooks'
import { ConnectExperienceItem } from './ConnectExperienceItem'
import type { SlotType } from '../constants'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/ui-kit/ui/sheet'
import { Input } from '@/ui-kit/ui/input'
import { Button } from '@/ui-kit/ui/button'

export interface ConnectExperienceDrawerProps {
  /** Controlled open state */
  open: boolean

  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void

  /** Slot being configured - determines profile filtering */
  slot: SlotType

  /** Workspace ID for fetching experiences */
  workspaceId: string

  /** Workspace slug for create link */
  workspaceSlug: string

  /** IDs of experiences already assigned to any slot in this event */
  assignedExperienceIds: string[]

  /** Callback when experience is selected */
  onSelect: (experienceId: string) => void

  /** Number of experiences to load per page. Default: 20 */
  pageSize?: number
}

/**
 * Drawer component for connecting experiences to events
 *
 * Features:
 * - Search experiences by name (debounced 300ms)
 * - Profile filtering based on slot compatibility
 * - Shows "in use" badge for assigned experiences
 * - "Create New Experience" button opens in new tab
 * - Empty states for no experiences and no search results
 *
 * @example
 * ```tsx
 * <ConnectExperienceDrawer
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   slot="main"
 *   workspaceId={workspaceId}
 *   workspaceSlug={workspaceSlug}
 *   assignedExperienceIds={assignedIds}
 *   onSelect={(id) => handleConnect(id)}
 * />
 * ```
 */
export function ConnectExperienceDrawer({
  open,
  onOpenChange,
  slot,
  workspaceId,
  workspaceSlug,
  assignedExperienceIds,
  onSelect,
  pageSize,
}: ConnectExperienceDrawerProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch experiences filtered by slot compatibility with pagination
  const {
    experiences,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = usePaginatedExperiencesForSlot(workspaceId, slot, { pageSize })

  // Filter experiences by search query (client-side)
  const filteredExperiences = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    if (!query) return experiences

    return experiences.filter((exp) => exp.name.toLowerCase().includes(query))
  }, [experiences, searchQuery])

  // Mark assigned experiences
  const assignedSet = useMemo(
    () => new Set(assignedExperienceIds),
    [assignedExperienceIds],
  )

  // Handle selection
  const handleSelect = (experienceId: string) => {
    onSelect(experienceId)
    onOpenChange(false)
  }

  // Handle create new experience
  const handleCreateNew = () => {
    window.open(`/workspace/${workspaceSlug}/experiences/create`, '_blank')
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Connect Experience</SheetTitle>
          <SheetDescription>
            Select an experience to add to this {slot} slot
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 h-full overflow-hidden px-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search experiences..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Create New Button */}
          <Button
            variant="outline"
            onClick={handleCreateNew}
            className="gap-2 justify-center"
          >
            <Plus className="h-4 w-4" />
            Create New Experience
            <ExternalLink className="h-3 w-3 ml-auto" />
          </Button>

          {/* Experience List */}
          <div className="flex-1 overflow-y-auto -mx-4 px-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            ) : filteredExperiences.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {searchQuery
                    ? 'No experiences found'
                    : 'No compatible experiences'}
                </p>
                <p className="text-xs text-muted-foreground text-center">
                  {searchQuery
                    ? 'Try adjusting your search'
                    : 'Create a new experience to get started'}
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {filteredExperiences.map((experience) => (
                    <ConnectExperienceItem
                      key={experience.id}
                      experience={experience}
                      isAssigned={assignedSet.has(experience.id)}
                      onSelect={() => handleSelect(experience.id)}
                    />
                  ))}
                </div>
                {hasNextPage && (
                  <div className="flex justify-center py-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      className="gap-2"
                    >
                      {isFetchingNextPage ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        'Load More'
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
