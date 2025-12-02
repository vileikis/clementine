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
  const [name, setName] = useState("")
  const [ownerId, setOwnerId] = useState<string>("")

  // Companies list
  const [companies, setCompanies] = useState<Company[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(true)

  // Validation errors
  const [nameError, setNameError] = useState<string | null>(null)
  const [ownerError, setOwnerError] = useState<string | null>(null)

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

  const validateOwner = (value: string): boolean => {
    if (!value) {
      setOwnerError("Owner is required")
      return false
    }
    setOwnerError(null)
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate
    const isNameValid = validateName(name)
    const isOwnerValid = validateOwner(ownerId)
    if (!isNameValid || !isOwnerValid) {
      return
    }

    setIsSubmitting(true)

    try {
      const result = await createEventAction({
        name: name.trim(),
        primaryColor: "#3B82F6", // Default theme color
        ownerId,
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
      {/* Name Input */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium mb-2"
        >
          Event Name <span className="text-red-500">*</span>
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
          placeholder="My Awesome Event"
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

      {/* Owner/Company Selector */}
      <div>
        <label
          htmlFor="owner"
          className="block text-sm font-medium mb-2"
        >
          Owner (Company) <span className="text-red-500">*</span>
        </label>
        <select
          id="owner"
          value={ownerId}
          onChange={(e) => {
            setOwnerId(e.target.value)
            if (ownerError) validateOwner(e.target.value)
          }}
          onBlur={() => validateOwner(ownerId)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 bg-background ${
            ownerError
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
        {ownerError && (
          <p className="text-sm text-red-500 mt-1">{ownerError}</p>
        )}
        <p className="text-sm text-muted-foreground mt-1">
          Associate this event with a brand or client
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
          disabled={isSubmitting || !name.trim() || !ownerId}
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
