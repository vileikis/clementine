/**
 * ProfileSelector Component
 *
 * Radio button selector for choosing an experience profile type.
 * Displays profile name and description for each option.
 */
import type { ExperienceProfile } from '@/domains/experience/shared'
import { profileMetadata } from '@/domains/experience/shared'
import { Label } from '@/ui-kit/ui/label'
import { cn } from '@/shared/utils/style-utils'

/**
 * Profile option with styling information
 */
const profileOptions: {
  value: ExperienceProfile
  colorClass: string
}[] = [
  { value: 'freeform', colorClass: 'border-blue-500' },
  { value: 'survey', colorClass: 'border-green-500' },
  { value: 'story', colorClass: 'border-purple-500' },
]

interface ProfileSelectorProps {
  /** Currently selected profile */
  value: ExperienceProfile
  /** Callback when profile selection changes */
  onChange: (profile: ExperienceProfile) => void
  /** Whether the selector is disabled */
  disabled?: boolean
  /** Error message to display */
  error?: string
}

/**
 * Profile selector component with radio buttons
 *
 * @example
 * ```tsx
 * <ProfileSelector
 *   value={selectedProfile}
 *   onChange={setSelectedProfile}
 * />
 * ```
 */
export function ProfileSelector({
  value,
  onChange,
  disabled,
  error,
}: ProfileSelectorProps) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Profile Type</Label>
      <div className="space-y-2">
        {profileOptions.map((option) => {
          const meta = profileMetadata[option.value]
          const isSelected = value === option.value

          return (
            <label
              key={option.value}
              className={cn(
                'flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors',
                isSelected && `border-2 ${option.colorClass} bg-muted/50`,
                !isSelected && 'border-border hover:bg-muted/50',
                disabled && 'opacity-50 cursor-not-allowed',
              )}
            >
              <input
                type="radio"
                name="profile"
                value={option.value}
                checked={isSelected}
                onChange={() => onChange(option.value)}
                disabled={disabled}
                className="mt-1 h-4 w-4"
              />
              <div>
                <span className="font-medium">{meta.label}</span>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {meta.description}
                </p>
              </div>
            </label>
          )
        })}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
