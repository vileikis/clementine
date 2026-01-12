import { useNavigate } from '@tanstack/react-router'
import { getWorkspaceInitials } from '../../lib'
import { useWorkspace } from '@/domains/workspace'
import { cn } from '@/shared/utils'

interface WorkspaceSelectorProps {
  workspaceSlug: string
  isCollapsed: boolean
}

export function WorkspaceSelector({
  workspaceSlug,
  isCollapsed,
}: WorkspaceSelectorProps) {
  const { data: workspace } = useWorkspace(workspaceSlug)
  const initials = getWorkspaceInitials(workspace?.name)
  const navigate = useNavigate()

  const handleClick = () => {
    navigate({ to: '/admin/workspaces' })
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'flex items-center gap-3 rounded-md transition-colors',
        'hover:bg-secondary/50',
        isCollapsed ? 'justify-center' : 'justify-start',
      )}
      aria-label={`Current workspace: ${workspace?.name || 'Unknown'}`}
      title={workspace?.name || 'Unknown workspace'}
    >
      {/* Avatar with initials */}
      <div
        className={cn(
          'flex items-center justify-center rounded-md font-semibold text-lg shrink-0',
          'bg-secondary text-secondary-foreground',
          'w-10 h-10',
        )}
      >
        {initials}
      </div>

      {/* Workspace name - hidden when collapsed */}
      {!isCollapsed && (
        <span className="font-medium text-sm truncate">
          {workspace?.name || 'Unknown'}
        </span>
      )}
    </button>
  )
}
