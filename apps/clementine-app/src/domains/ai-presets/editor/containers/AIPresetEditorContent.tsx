/**
 * AIPresetEditorContent Container
 *
 * Two-column layout containing all editor sections.
 * This is a pure layout container - sections handle their own updates.
 *
 * Following Experience Designer pattern:
 * - AIPresetEditorLayout handles TopNavBar, publish, and version tracking
 * - AIPresetEditorContent handles layout only
 * - Section components (ModelSettingsSection, MediaRegistrySection) handle their own updates
 *
 * Layout:
 * - Left: Main work area with tabs (Edit | Preview)
 * - Right: AIPresetConfigPanel (collapsible sections for model, media, variables)
 */
import { AIPresetConfigPanel } from '../components/AIPresetConfigPanel'
import { PromptTemplateEditor } from '../components/PromptTemplateEditor'
import type { AIPresetConfig } from '@clementine/shared'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui-kit/ui/tabs'

interface AIPresetEditorContentProps {
  draft: AIPresetConfig
  workspaceId: string
  presetId: string
  userId: string
  disabled?: boolean
}

/**
 * AI preset editor content with two-column layout
 *
 * Left panel: Main work area with tabs (Edit | Preview)
 *   - Edit: Prompt template editor
 *   - Preview: Testing and validation (reserved for future)
 * Right panel: Configuration panel with collapsible sections (model, media, variables)
 *
 * Sections are self-contained and handle their own updates.
 *
 * @example
 * ```tsx
 * <AIPresetEditorContent
 *   draft={preset.draft}
 *   workspaceId={workspaceId}
 *   presetId={preset.id}
 *   userId={user.uid}
 *   disabled={isPublishing}
 * />
 * ```
 */
export function AIPresetEditorContent({
  draft,
  workspaceId,
  presetId,
  userId,
  disabled = false,
}: AIPresetEditorContentProps) {
  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left panel - Main Work Area with Tabs */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Tabs
          defaultValue="edit"
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="border-b px-6 pt-6">
            <TabsList variant="line">
              <TabsTrigger value="edit">Edit</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
          </div>

          {/* Edit Tab - Prompt Template Editor */}
          <TabsContent value="edit" className="flex-1 overflow-y-auto p-6 m-0">
            <PromptTemplateEditor
              value={draft.promptTemplate || ''}
              variables={draft.variables}
              media={draft.mediaRegistry}
              workspaceId={workspaceId}
              presetId={presetId}
              disabled={disabled}
            />
          </TabsContent>

          {/* Preview Tab - Reserved for Testing/Validation */}
          <TabsContent
            value="preview"
            className="flex-1 overflow-y-auto p-6 m-0"
          >
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Preview and testing functionality coming soon.
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Test and validate the preset with real input values before
                  publishing.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Right panel - Configuration Panel */}
      <aside className="w-80 shrink-0 border-l overflow-y-auto bg-card">
        <AIPresetConfigPanel
          draft={draft}
          workspaceId={workspaceId}
          presetId={presetId}
          userId={userId}
          disabled={disabled}
        />
      </aside>
    </div>
  )
}
