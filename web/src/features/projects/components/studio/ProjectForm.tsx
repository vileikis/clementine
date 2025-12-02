"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createProjectAction } from "../../actions/projects.actions"
import { listCompaniesAction } from "@/features/companies/actions"
import type { Company } from "@/features/companies"

interface ProjectFormProps {
  onSuccess?: (projectId: string) => void
}

export function ProjectForm({ onSuccess }: ProjectFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState("")
  const [companyId, setCompanyId] = useState<string>("")

  // Companies list
  const [companies, setCompanies] = useState<Company[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(true)

  // Validation errors
  const [nameError, setNameError] = useState<string | null>(null)
  const [companyError, setCompanyError] = useState<string | null>(null)

  // Load companies on mount
  useEffect(() => {
    async function loadCompanies() {
      setLoadingCompanies(true)
      const result = await listCompaniesAction()
      if (result.success) {
        setCompanies(result.companies ?? [])
      }
      setLoadingCompanies(false)
    }
    loadCompanies()
  }, [])

  const validateName = (value: string): boolean => {
    if (!value.trim()) {
      setNameError("Name is required")
      return false
    }
    if (value.length > 200) {
      setNameError("Name must be 200 characters or less")
      return false
    }
    setNameError(null)
    return true
  }

  const validateCompany = (value: string): boolean => {
    if (!value) {
      setCompanyError("Company is required")
      return false
    }
    setCompanyError(null)
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate
    const isNameValid = validateName(name)
    const isCompanyValid = validateCompany(companyId)
    if (!isNameValid || !isCompanyValid) {
      return
    }

    setIsSubmitting(true)

    try {
      const result = await createProjectAction({
        name: name.trim(),
        primaryColor: "#3B82F6", // Default theme color
        companyId,
      })

      if (result.success && result.projectId) {
        // Success! Redirect to project detail page
        if (onSuccess) {
          onSuccess(result.projectId)
        }
        router.push(`/projects/${result.projectId}`)
      } else {
        setError(result.error?.message || "Failed to create project")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name Input */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium mb-2"
        >
          Project Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            if (nameError) validateName(e.target.value)
          }}
          onBlur={() => validateName(name)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
            nameError
              ? "border-red-500 focus:ring-red-500"
              : "border-input focus:ring-primary"
          }`}
          placeholder="My Awesome Project"
          disabled={isSubmitting}
          maxLength={200}
        />
        {nameError && (
          <p className="text-sm text-red-500 mt-1">{nameError}</p>
        )}
        <p className="text-sm text-muted-foreground mt-1">
          {name.length}/200 characters
        </p>
      </div>

      {/* Company Selector */}
      <div>
        <label
          htmlFor="company"
          className="block text-sm font-medium mb-2"
        >
          Company <span className="text-red-500">*</span>
        </label>
        <select
          id="company"
          value={companyId}
          onChange={(e) => {
            setCompanyId(e.target.value)
            if (companyError) validateCompany(e.target.value)
          }}
          onBlur={() => validateCompany(companyId)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 bg-background ${
            companyError
              ? "border-red-500 focus:ring-red-500"
              : "border-input focus:ring-primary"
          }`}
          disabled={isSubmitting || loadingCompanies}
        >
          <option value="">Select a company...</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
        {companyError && (
          <p className="text-sm text-red-500 mt-1">{companyError}</p>
        )}
        <p className="text-sm text-muted-foreground mt-1">
          Associate this project with a brand or client
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting || !name.trim() || !companyId}
          className="flex-1 inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Creating..." : "Create Project"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/projects")}
          disabled={isSubmitting}
          className="px-6 py-3 text-sm font-medium border border-input rounded-md hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
