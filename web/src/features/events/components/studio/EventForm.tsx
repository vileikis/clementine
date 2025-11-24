"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createEventAction } from "../../actions/events"
import { listCompaniesAction } from "@/features/companies/actions"
import type { Company } from "@/features/companies"

interface EventFormProps {
  onSuccess?: (eventId: string) => void
}

export function EventForm({ onSuccess }: EventFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState("")
  const [buttonColor, setButtonColor] = useState("#0EA5E9")
  const [companyId, setCompanyId] = useState<string>("")

  // Companies list
  const [companies, setCompanies] = useState<Company[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(true)

  // Validation errors
  const [titleError, setTitleError] = useState<string | null>(null)
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

  const validateTitle = (value: string): boolean => {
    if (!value.trim()) {
      setTitleError("Title is required")
      return false
    }
    if (value.length > 100) {
      setTitleError("Title must be 100 characters or less")
      return false
    }
    setTitleError(null)
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
    const isTitleValid = validateTitle(title)
    const isCompanyValid = validateCompany(companyId)
    if (!isTitleValid || !isCompanyValid) {
      return
    }

    setIsSubmitting(true)

    try {
      const result = await createEventAction({
        title: title.trim(),
        buttonColor,
        companyId,
      })

      if (result.success && result.eventId) {
        // Success! Redirect to event detail page
        if (onSuccess) {
          onSuccess(result.eventId)
        }
        router.push(`/events/${result.eventId}`)
      } else {
        setError(result.error?.message || "Failed to create event")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title Input */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium mb-2"
        >
          Event Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            if (titleError) validateTitle(e.target.value)
          }}
          onBlur={() => validateTitle(title)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
            titleError
              ? "border-red-500 focus:ring-red-500"
              : "border-input focus:ring-primary"
          }`}
          placeholder="My Awesome Event"
          disabled={isSubmitting}
          maxLength={100}
        />
        {titleError && (
          <p className="text-sm text-red-500 mt-1">{titleError}</p>
        )}
        <p className="text-sm text-muted-foreground mt-1">
          {title.length}/100 characters
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
          Associate this event with a brand or client
        </p>
      </div>

      {/* Button Color Picker */}
      <div>
        <label
          htmlFor="buttonColor"
          className="block text-sm font-medium mb-2"
        >
          Button Color
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            id="buttonColor"
            value={buttonColor}
            onChange={(e) => setButtonColor(e.target.value)}
            className="h-12 w-20 border border-input rounded-md cursor-pointer"
            disabled={isSubmitting}
          />
          <input
            type="text"
            value={buttonColor}
            onChange={(e) => {
              const value = e.target.value
              // Allow typing hex colors
              if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                setButtonColor(value)
              }
            }}
            className="flex-1 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary font-mono"
            placeholder="#0EA5E9"
            disabled={isSubmitting}
            maxLength={7}
          />
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          This color will be used for buttons throughout the event
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
          disabled={isSubmitting || !title.trim() || !companyId}
          className="flex-1 inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Creating..." : "Create Event"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/events")}
          disabled={isSubmitting}
          className="px-6 py-3 text-sm font-medium border border-input rounded-md hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
