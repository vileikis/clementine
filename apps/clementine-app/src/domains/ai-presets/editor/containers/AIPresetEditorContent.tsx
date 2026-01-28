/**
 * AIPresetEditorContent Container
 *
 * Two-column layout containing all editor sections.
 * This is a pure layout container - sections handle their own updates.
 *
 * Following Experience Designer pattern:
 * - AIPresetEditorLayout handles TopNavBar, publish, and version tracking
 * - AIPresetEditorContent handles layout only
 * - Section components handle their own updates
 *
 * Phase 11.5 Layout:
 * - Left: Edit tab with Prompt Template (primary) + Variables (secondary)
 * - Right: Config panel with Model Settings + Media Registry
 */
import { AIPresetConfigPanel } from '../components/AIPresetConfigPanel'
import { PromptTemplateEditor } from '../components/PromptTemplateEditor'
import { VariablesSection } from '../components/VariablesSection'
import { AIPresetPreviewPanel } from '../../preview/components/AIPresetPreviewPanel'
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
 * Phase 11.5 layout (prompt-first, variables in Edit tab):
 *
 * Left panel: Main work area with tabs (Edit | Preview)
 *   - Edit: Prompt template editor (primary) + Variables section (secondary)
 *   - Preview: Testing and validation (reserved for future)
 *
 * Right panel: Configuration panel
 *   - Model Settings (infrastructure)
 *   - Media Registry (assets)
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
          <div className="border-b px-6 pt-2">
            <TabsList variant="line">
              <TabsTrigger value="edit">Edit</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
          </div>

          {/* Edit Tab - Prompt Template + Variables */}
          <TabsContent value="edit" className="flex-1 overflow-y-auto p-6 m-0">
            <div className="space-y-8">
              {/* Prompt Template Editor (Primary) */}
              <div>
                <h2 className="mb-4 text-lg font-semibold">Prompt Template</h2>
                <PromptTemplateEditor
                  value={draft.promptTemplate || ''}
                  variables={draft.variables}
                  media={draft.mediaRegistry}
                  workspaceId={workspaceId}
                  presetId={presetId}
                  disabled={disabled}
                />
              </div>

              {/* Variables Section (Secondary) */}
              <div>
                <VariablesSection
                  variables={draft.variables}
                  media={draft.mediaRegistry}
                  workspaceId={workspaceId}
                  presetId={presetId}
                  disabled={disabled}
                  showHeader={true}
                />
              </div>
            </div>
          </TabsContent>

          {/* Preview Tab - Testing and Validation */}
          <TabsContent
            value="preview"
            className="flex-1 overflow-y-auto p-6 m-0"
          >
            <AIPresetPreviewPanel
              workspaceId={workspaceId}
              presetId={presetId}
            />
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
