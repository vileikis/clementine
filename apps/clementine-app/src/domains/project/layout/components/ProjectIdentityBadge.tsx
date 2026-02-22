import { Pencil } from 'lucide-react'

interface ProjectIdentityBadgeProps {
  name: string
  onClick: () => void
}

export function ProjectIdentityBadge({
  name,
  onClick,
}: ProjectIdentityBadgeProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Rename project ${name}`}
      title={name}
      className="group flex items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-accent"
    >
      {/* Name */}
      <span className="max-w-[200px] truncate text-sm font-medium">{name}</span>

      {/* Pencil icon (visible on hover) */}
      <Pencil className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  )
}
