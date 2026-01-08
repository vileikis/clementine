/**
 * MediaReference Schema for Experience Domain
 *
 * Re-exports the shared MediaReference schema for use within the experience domain.
 * This provides a consistent API for experience-related code while maintaining
 * a single source of truth for the schema definition.
 *
 * @see @/shared/theming/schemas/media-reference.schema.ts for the source definition
 */
export {
  mediaReferenceSchema,
  type MediaReference,
} from '@/shared/theming/schemas/media-reference.schema'
