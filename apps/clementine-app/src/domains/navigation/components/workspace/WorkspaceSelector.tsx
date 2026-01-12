import { useNavigate } from '@tanstack/react-router'
import { ArrowLeftRight } from 'lucide-react'
import { getWorkspaceInitials } from '../../lib'
import { useWorkspace } from '@/domains/workspace'
import { cn } from '@/shared/utils'
import { Button } from '@/ui-kit/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui-kit/ui/tooltip'

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

  const handleSwitch = () => {
    navigate({ to: '/admin/workspaces' })
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-md w-full',
        isCollapsed ? 'justify-center' : 'justify-between',
      )}
      title={workspace?.name || 'Unknown workspace'}
    >
      <div className="flex items-center gap-3 min-w-0">
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
      </div>

      {/* Switch button */}
      {!isCollapsed && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSwitch}
              className="shrink-0 h-8 w-8"
              aria-label="Switch workspace"
            >
              <ArrowLeftRight className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Switch workspace</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}
