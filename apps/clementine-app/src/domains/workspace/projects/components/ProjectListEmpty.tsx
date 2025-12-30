import { Button } from '@/ui-kit/components/button'
import { Card } from '@/ui-kit/components/card'

interface ProjectListEmptyProps {
  onCreateProject: () => void
}

export function ProjectListEmpty({ onCreateProject }: ProjectListEmptyProps) {
  return (
    <Card className="p-8 text-center">
      <h3 className="text-lg font-semibold">No projects yet</h3>
      <p className="text-muted-foreground mt-2 mb-4">
        Create your first project to get started
      </p>
      <Button onClick={onCreateProject}>Create Project</Button>
    </Card>
  )
}
