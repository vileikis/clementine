/**
 * Experience Type Icons
 *
 * Centralized icon mapping for experience types.
 * Uses react-icons/ri for AI types to better convey AI context.
 */
import { Camera, Film, FormInput, Video } from 'lucide-react'
import { RiImageAiLine, RiVideoOnAiLine } from 'react-icons/ri'
import type { ComponentType } from 'react'
import type { ExperienceType } from '@clementine/shared'

/** Icon component that accepts at least className */
export type ExperienceIcon = ComponentType<{ className?: string }>

export const experienceTypeIcons: Record<ExperienceType, ExperienceIcon> = {
  survey: FormInput,
  photo: Camera,
  gif: Film,
  video: Video,
  'ai.image': RiImageAiLine,
  'ai.video': RiVideoOnAiLine,
}

export function getExperienceTypeIcon(type: ExperienceType): ExperienceIcon {
  return experienceTypeIcons[type]
}
