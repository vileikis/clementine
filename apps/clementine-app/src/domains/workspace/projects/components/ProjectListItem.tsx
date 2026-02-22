import { Link } from '@tanstack/react-router'
import { MoreVertical } from 'lucide-react'

import type { Project } from '../types'
import type { MenuSection } from '@/shared/components/ContextDropdownMenu'
import { ContextDropdownMenu } from '@/shared/components/ContextDropdownMenu'
import { Badge } from '@/ui-kit/ui/badge'
import { Button } from '@/ui-kit/ui/button'
import { Card } from '@/ui-kit/ui/card'

interface ProjectListItemProps {
  project: Project
  workspaceSlug: string
  menuSections?: MenuSection[]
}

export function ProjectListItem({
  project,
  workspaceSlug,
  menuSections,
}: ProjectListItemProps) {
  return (
    <Link
      to="/workspace/$workspaceSlug/projects/$projectId"
      params={{ workspaceSlug, projectId: project.id }}
    >
      <Card className="cursor-pointer p-4 transition-colors hover:bg-accent/50">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{project.name}</h3>
            <Badge
              variant={project.status === 'live' ? 'default' : 'secondary'}
            >
              {project.status}
            </Badge>
          </div>

          {/* Context menu */}
          {menuSections && (
            <div onClick={(e) => e.preventDefault()}>
              <ContextDropdownMenu
                trigger={
                  <Button variant="ghost" size="icon" className="h-11 w-11">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Actions</span>
                  </Button>
                }
                sections={menuSections}
              />
            </div>
          )}
        </div>
      </Card>
    </Link>
  )
}
