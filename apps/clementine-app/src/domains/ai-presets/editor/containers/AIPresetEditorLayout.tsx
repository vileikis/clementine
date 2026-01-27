/**
 * AIPresetEditorLayout Container
 *
 * Domain-owned layout for AI preset editor. Handles publish workflow,
 * change detection, and integrates TopNavBar + AIPresetEditorContent.
 *
 * Following Experience Designer pattern:
 * - Layout handles TopNavBar, publish button, version tracking
 * - Content (AIPresetEditorContent) handles the actual editor sections
 */
import { useCallback, useEffect, useMemo } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

import { AIPresetNameBadge } from '../components/AIPresetNameBadge'
import { usePublishAIPreset } from '../hooks/usePublishAIPreset'
import { useUpdateAIPreset } from '../hooks/useUpdateAIPreset'
import { useAIPresetEditorStore } from '../stores/useAIPresetEditorStore'
import { AIPresetEditorContent } from './AIPresetEditorContent'
import type { AIPreset } from '@clementine/shared'
import { useAuth } from '@/domains/auth'
import { TopNavBar } from '@/domains/navigation'
import { EditorChangesBadge, EditorSaveStatus } from '@/shared/editor-status'
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
 * - EditorChangesBadge showing unpublished changes
 * - Publish button (replaces Save button in Phase 5.5)
 * - AIPresetEditorContent for two-column layout
 *
 * Draft/Published Workflow:
 * - All edits auto-save to preset.draft
 * - Publish button copies draft → published
 * - EditorChangesBadge shows when draftVersion > publishedVersion
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
  const { user } = useAuth()
  const { pendingSaves, lastCompletedAt, resetSaveState } =
    useAIPresetEditorStore()
  const updatePreset = useUpdateAIPreset(workspaceId, preset.id)
  const publishPreset = usePublishAIPreset()

  // Compute paths for breadcrumb navigation
  const presetsPath = `/workspace/${workspaceSlug}/ai-presets`

  // Detect unpublished changes using version-based comparison
  const hasUnpublishedChanges = useMemo(() => {
    // Never published: always has unpublished changes (if draft exists)
    if (preset.publishedVersion === null) {
      return preset.draft !== null
    }
    // Has changes if draft version is higher than published version
    return preset.draftVersion > preset.publishedVersion
  }, [preset.draftVersion, preset.publishedVersion, preset.draft])

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

  // Handle publish button click
  const handlePublish = useCallback(async () => {
    if (!user) {
      toast.error('You must be logged in to publish')
      return
    }

    try {
      await publishPreset.mutateAsync({
        workspaceId,
        preset,
        userId: user.uid,
      })
      toast.success('Preset published', {
        description: 'Your changes are now live.',
      })
    } catch (error) {
      toast.error('Failed to publish preset', {
        description:
          error instanceof Error ? error.message : 'An error occurred',
      })
    }
  }, [publishPreset, workspaceId, preset, user])

  const isPublishing = publishPreset.isPending
  const isDisabled = updatePreset.isPending || isPublishing

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
                disabled={isDisabled}
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
            <EditorChangesBadge
              draftVersion={preset.draftVersion}
              publishedVersion={preset.publishedVersion}
            />
            <Button
              onClick={handlePublish}
              disabled={!hasUnpublishedChanges || isPublishing}
            >
              {isPublishing && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Publish
            </Button>
          </>
        }
      />

      {/* Two-column editor content */}
      <AIPresetEditorContent
        draft={preset.draft}
        workspaceId={workspaceId}
        presetId={preset.id}
        userId={user?.uid ?? ''}
        disabled={isDisabled}
      />
    </div>
  )
}
