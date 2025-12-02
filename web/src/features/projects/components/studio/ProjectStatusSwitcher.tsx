"use client"

import { useState } from "react"
import { updateProjectStatusAction } from "../../actions/projects.actions"
import type { ProjectStatus } from "../../types/project.types"

// Only allow setting these statuses (not "deleted" - that requires delete action)
type SettableStatus = Exclude<ProjectStatus, "deleted">

interface ProjectStatusSwitcherProps {
  projectId: string
  currentStatus: SettableStatus
}

const statusOptions: { value: SettableStatus; label: string; color: string }[] = [
  { value: "draft", label: "Draft", color: "bg-yellow-100 text-yellow-800" },
  { value: "live", label: "Live", color: "bg-green-100 text-green-800" },
  { value: "archived", label: "Archived", color: "bg-gray-100 text-gray-800" },
]

export function ProjectStatusSwitcher({
  projectId,
  currentStatus,
}: ProjectStatusSwitcherProps) {
  const [status, setStatus] = useState<SettableStatus>(currentStatus)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleStatusChange = async (newStatus: SettableStatus) => {
    if (newStatus === status || isUpdating) return

    setIsUpdating(true)
    const result = await updateProjectStatusAction(projectId, newStatus)

    if (result.success) {
      setStatus(newStatus)
    }

    setIsUpdating(false)
  }

  return (
    <div
      className="relative"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
    >
      <select
        value={status}
        onChange={(e) => handleStatusChange(e.target.value as SettableStatus)}
        disabled={isUpdating}
        className={`px-2 py-1 text-xs font-medium rounded-full border cursor-pointer transition-opacity ${
          statusOptions.find((opt) => opt.value === status)?.color
        } ${isUpdating ? "opacity-50 cursor-not-allowed" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {statusOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
