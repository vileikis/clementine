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
 */
import { MediaRegistrySection } from '../components/MediaRegistrySection'
import { ModelSettingsSection } from '../components/ModelSettingsSection'
import { PromptTemplateEditor } from '../components/PromptTemplateEditor'
import { VariablesSection } from '../components/VariablesSection'
import type { AIPresetConfig } from '@clementine/shared'

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
 * Left panel: Configuration sections (model, media, variables)
 * Right panel: Prompt template editor (Phase 8)
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
      {/* Left panel - Configuration */}
      <div className="flex w-[400px] flex-col gap-6 overflow-y-auto border-r p-6">
        {/* Model Settings Section */}
        <section>
          <h2 className="mb-4 text-sm font-medium text-muted-foreground">
            Model Settings
          </h2>
          <ModelSettingsSection
            model={draft.model}
            aspectRatio={draft.aspectRatio}
            workspaceId={workspaceId}
            presetId={presetId}
            disabled={disabled}
          />
        </section>

        {/* Media Registry Section */}
        <section>
          <h2 className="mb-4 text-sm font-medium text-muted-foreground">
            Media Registry
          </h2>
          <MediaRegistrySection
            mediaRegistry={draft.mediaRegistry}
            workspaceId={workspaceId}
            presetId={presetId}
            userId={userId}
            disabled={disabled}
          />
        </section>

        {/* Variables Section */}

        <VariablesSection
          variables={draft.variables}
          workspaceId={workspaceId}
          presetId={presetId}
          disabled={disabled}
        />
      </div>

      {/* Right panel - Prompt Template */}
      <div className="flex-1 overflow-y-auto p-6">
        <section>
          <h2 className="mb-4 text-sm font-medium text-muted-foreground">
            Prompt Template
          </h2>
          <PromptTemplateEditor
            value={draft.promptTemplate || ''}
            variables={draft.variables}
            media={draft.mediaRegistry}
            workspaceId={workspaceId}
            presetId={presetId}
            disabled={disabled}
          />
        </section>
      </div>
    </div>
  )
}
