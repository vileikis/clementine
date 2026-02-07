/**
 * ShareEditorPage Container
 *
 * 2-column layout with live preview (right) and controls (left).
 * Supports both ready and loading state configuration with tab switching.
 * Integrates with auto-save, tracked mutations, and PreviewShell.
 */

import { useState } from 'react'
import { useParams } from '@tanstack/react-router'
import {
  ShareLoadingConfigPanel,
  ShareLoadingRenderer,
  ShareReadyConfigPanel,
  ShareReadyRenderer,
} from '../components'
import {
  useShareLoadingForm,
  useShareOptionsForm,
  useShareReadyForm,
} from '../hooks'
import { DEFAULT_SHARE_LOADING, DEFAULT_SHARE_READY } from '../constants'
import type {
  ShareLoadingConfig,
  ShareOptionsConfig,
  ShareReadyConfig,
} from '@clementine/shared'
import { Tabs, TabsList, TabsTrigger } from '@/ui-kit/ui/tabs'
import { PreviewShell } from '@/shared/preview-shell'
import { useProject } from '@/domains/project/shared'
import { DEFAULT_THEME } from '@/domains/project-config/theme/constants'
import { ThemeProvider, ThemedBackground } from '@/shared/theming'

// Default share options when none exist
const DEFAULT_SHARE_OPTIONS: ShareOptionsConfig = {
  download: true,
  copyLink: true,
  email: false,
  instagram: false,
  facebook: false,
  linkedin: false,
  twitter: false,
  tiktok: false,
  telegram: false,
}

// Preview state type
type PreviewState = 'ready' | 'loading'

export function ShareEditorPage() {
  const { projectId } = useParams({ strict: false })
  const { data: project } = useProject(projectId ?? '')

  // Preview state (controls both preview and config panel)
  const [previewState, setPreviewState] = useState<PreviewState>('ready')

  // Get current configs from project or use defaults
  const currentShareReady: ShareReadyConfig =
    project?.draftConfig?.shareReady ?? DEFAULT_SHARE_READY
  const currentShareLoading =
    project?.draftConfig?.shareLoading ?? DEFAULT_SHARE_LOADING

  // Get current share options from project or use defaults
  const currentShareOptions =
    project?.draftConfig?.shareOptions ?? DEFAULT_SHARE_OPTIONS

  // Get current theme from project or use defaults
  const currentTheme = project?.draftConfig?.theme ?? DEFAULT_THEME

  // Form hooks encapsulate all form logic, auto-save, and handlers
  const {
    watchedShare,
    handleShareUpdate,
    ctaUrlError,
    handleCtaUrlBlur,
    clearCtaUrlError,
  } = useShareReadyForm({
    projectId: projectId ?? '',
    currentShareReady,
  })

  const { watchedShareLoading, handleShareLoadingUpdate } = useShareLoadingForm(
    {
      projectId: projectId ?? '',
      currentShareLoading,
    },
  )

  // Share options form hook
  const { displayShareOptions, handleShareOptionToggle } = useShareOptionsForm({
    projectId: projectId ?? '',
    currentShareOptions,
  })

  // Loading state
  if (!project) {
    return null
  }

  // Merge watched values with defaults for complete share object
  const previewShare: ShareReadyConfig = {
    ...DEFAULT_SHARE_READY,
    ...watchedShare,
  }

  const previewShareLoading: ShareLoadingConfig = {
    ...DEFAULT_SHARE_LOADING,
    ...watchedShareLoading,
  }

  return (
    <div className="flex h-full">
      {/* Right: Preview */}
      <div className="flex-1 min-w-0">
        <PreviewShell
          enableViewportSwitcher
          enableFullscreen
          headerSlot={
            <Tabs
              value={previewState}
              onValueChange={(v: string) => setPreviewState(v as PreviewState)}
            >
              <TabsList>
                <TabsTrigger value="ready">Ready</TabsTrigger>
                <TabsTrigger value="loading">Loading</TabsTrigger>
              </TabsList>
            </Tabs>
          }
        >
          <ThemeProvider theme={currentTheme}>
            <ThemedBackground className="h-full w-full">
              {previewState === 'loading' ? (
                <ShareLoadingRenderer shareLoading={previewShareLoading} />
              ) : (
                <ShareReadyRenderer
                  share={previewShare}
                  shareOptions={displayShareOptions}
                />
              )}
            </ThemedBackground>
          </ThemeProvider>
        </PreviewShell>
      </div>

      {/* Left: Controls */}
      <aside className="w-80 shrink-0 border-r border-border overflow-y-auto bg-card">
        <div className="sticky top-0 z-10 border-b border-border bg-card px-4 py-3">
          <h2 className="font-semibold">
            Share
            <span> · {previewState === 'ready' ? 'Ready' : 'Loading'}</span>
          </h2>
        </div>

        {previewState === 'ready' ? (
          <ShareReadyConfigPanel
            share={previewShare}
            shareOptions={displayShareOptions}
            onShareUpdate={handleShareUpdate}
            onShareOptionToggle={handleShareOptionToggle}
            ctaUrlError={ctaUrlError}
            onCtaUrlBlur={handleCtaUrlBlur}
            onCtaUrlChange={clearCtaUrlError}
          />
        ) : (
          <ShareLoadingConfigPanel
            shareLoading={previewShareLoading}
            onShareLoadingUpdate={handleShareLoadingUpdate}
          />
        )}
      </aside>
    </div>
  )
}
