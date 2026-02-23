/**
 * PromptComposerContext
 *
 * React Context that distributes modality configuration and runtime state
 * to PromptComposer child components (ControlRow, ReferenceMediaStrip,
 * AddMediaButton). Eliminates prop drilling through the component tree.
 *
 * @see specs/001-prompt-composer-refactor
 */
import { createContext, useContext } from 'react'

import type { ExperienceStep, MediaReference  } from '@clementine/shared'
import type { ModalityDefinition } from '../../lib/modality-definitions'
import type { UploadingFile } from '../../hooks/useRefMediaUpload'

export interface ModalityControlValues {
  aspectRatio?: string
  onAspectRatioChange?: (value: string) => void
  duration?: string
  onDurationChange?: (value: string) => void
}

export interface RefMediaState {
  items: MediaReference[]
  onRemove: (mediaAssetId: string) => void
  uploadingFiles: UploadingFile[]
  onFilesSelected: (files: File[]) => void
  canAddMore: boolean
  isUploading: boolean
}

export interface PromptComposerContextValue {
  modality: ModalityDefinition
  prompt: string
  onPromptChange: (value: string) => void
  model: string
  onModelChange: (value: string) => void
  controls?: ModalityControlValues
  refMedia?: RefMediaState
  steps: ExperienceStep[]
  disabled: boolean
  error?: string
}

const PromptComposerContext = createContext<PromptComposerContextValue | null>(
  null,
)

export function PromptComposerProvider({
  value,
  children,
}: {
  value: PromptComposerContextValue
  children: React.ReactNode
}) {
  return (
    <PromptComposerContext.Provider value={value}>
      {children}
    </PromptComposerContext.Provider>
  )
}

export function usePromptComposerContext(): PromptComposerContextValue {
  const context = useContext(PromptComposerContext)
  if (context === null) {
    throw new Error(
      'usePromptComposerContext must be used within PromptComposer',
    )
  }
  return context
}
