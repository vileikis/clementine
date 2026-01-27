/**
 * AIPresetEditorLayout Container
 *
 * Domain-owned layout for AI preset editor. Handles save workflow
 * and integrates TopNavBar with two-column editor content.
 */
import { useCallback, useEffect } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

import { AIPresetNameBadge } from '../components/AIPresetNameBadge'
import { useUpdateAIPreset } from '../hooks/useUpdateAIPreset'
import { useAIPresetEditorStore } from '../stores/useAIPresetEditorStore'
import type { AIPreset } from '@clementine/shared'
import { TopNavBar } from '@/domains/navigation'
import { EditorSaveStatus } from '@/shared/editor-status'
import { Button } from '@/ui-kit/ui/button'

interface AIPresetEditorLayoutProps {
  preset: AIPreset
  workspaceSlug: string
  workspaceId: string
}

/**
 * AI preset editor layout with domain-owned UI
 *
 * Features:
 * - TopNavBar with breadcrumbs (AI Presets → Preset Name)
 * - Inline editable preset name in breadcrumb
 * - Save status indicator (spinner/checkmark)
 * - Save button for explicit save
 * - Two-column layout for configuration
 *
 * @example
 * ```tsx
 * function PresetEditorRoute() {
 *   const { preset, workspaceSlug, workspaceId } = Route.useLoaderData()
 *   return (
 *     <AIPresetEditorLayout
 *       preset={preset}
 *       workspaceSlug={workspaceSlug}
 *       workspaceId={workspaceId}
 *     />
 *   )
 * }
 * ```
 */
export function AIPresetEditorLayout({
  preset,
  workspaceSlug,
  workspaceId,
}: AIPresetEditorLayoutProps) {
  const { pendingSaves, lastCompletedAt, resetSaveState } =
    useAIPresetEditorStore()
  const updatePreset = useUpdateAIPreset(workspaceId, preset.id)

  // Compute paths for breadcrumb navigation
  const presetsPath = `/workspace/${workspaceSlug}/ai-presets`

  // Cleanup: reset save state on unmount
  useEffect(() => {
    return () => resetSaveState()
  }, [resetSaveState])

  // Handle name change from badge
  const handleNameChange = useCallback(
    async (name: string) => {
      try {
        await updatePreset.mutateAsync({ name })
      } catch (error) {
        toast.error('Failed to update preset name', {
          description:
            error instanceof Error ? error.message : 'An error occurred',
        })
      }
    },
    [updatePreset],
  )

  // Handle explicit save button click
  const handleSave = useCallback(() => {
    // Currently the editor uses auto-save, so this is a no-op
    // In the future, this could trigger immediate save of pending changes
    toast.success('All changes saved')
  }, [])

  return (
    <div className="flex h-screen flex-col">
      <TopNavBar
        className="shrink-0"
        breadcrumbs={[
          {
            label: (
              <AIPresetNameBadge
                preset={preset}
                onNameChange={handleNameChange}
                disabled={updatePreset.isPending}
              />
            ),
            icon: Sparkles,
            iconHref: presetsPath,
          },
        ]}
        right={
          <>
            <EditorSaveStatus
              pendingSaves={pendingSaves}
              lastCompletedAt={lastCompletedAt}
            />
            <Button onClick={handleSave} disabled={pendingSaves > 0}>
              {pendingSaves > 0 && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save
            </Button>
          </>
        }
      />

      {/* Two-column editor content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel - Configuration */}
        <div className="flex w-[400px] flex-col gap-6 overflow-y-auto border-r p-6">
          {/* Model Settings Section - placeholder for Phase 4 */}
          <section>
            <h2 className="mb-4 text-sm font-medium text-muted-foreground">
              Model Settings
            </h2>
            <div className="text-sm text-muted-foreground">
              Model and aspect ratio settings will be added in Phase 4.
            </div>
          </section>

          {/* Media Registry Section - placeholder for Phase 5 */}
          <section>
            <h2 className="mb-4 text-sm font-medium text-muted-foreground">
              Media Registry
            </h2>
            <div className="text-sm text-muted-foreground">
              Media registry will be added in Phase 5.
            </div>
          </section>

          {/* Variables Section - placeholder for Phase 6 */}
          <section>
            <h2 className="mb-4 text-sm font-medium text-muted-foreground">
              Variables
            </h2>
            <div className="text-sm text-muted-foreground">
              Variables will be added in Phase 6.
            </div>
          </section>
        </div>

        {/* Right panel - Prompt Template */}
        <div className="flex-1 overflow-y-auto p-6">
          <section>
            <h2 className="mb-4 text-sm font-medium text-muted-foreground">
              Prompt Template
            </h2>
            <div className="text-sm text-muted-foreground">
              Prompt template editor will be added in Phase 8.
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
