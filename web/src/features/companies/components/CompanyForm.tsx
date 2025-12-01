"use client";

import { useState, useEffect } from "react";
import { createCompanyAction, updateCompanyAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Company } from "../types";
import { generateSlug, isValidSlug } from "@/lib/utils/slug";
import { COMPANY_CONSTRAINTS } from "../constants";

interface CompanyFormProps {
  company?: Company; // If provided, form is in edit mode
  onSuccess?: (companyId: string) => void;
  onCancel?: () => void;
}

/**
 * Form for creating and editing companies
 * @param company - Existing company data (for edit mode)
 * @param onSuccess - Callback fired after successful save
 * @param onCancel - Callback fired when user cancels
 */
export function CompanyForm({ company, onSuccess, onCancel }: CompanyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  // Validation errors
  const [nameError, setNameError] = useState<string | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);

  // Initialize form with company data if in edit mode
  useEffect(() => {
    if (company) {
      setName(company.name);
      setSlug(company.slug);
      setSlugTouched(true); // Don't auto-generate slug in edit mode
    }
  }, [company]);

  const validateName = (value: string): boolean => {
    if (!value.trim()) {
      setNameError("Company name is required");
      return false;
    }
    if (value.length > 100) {
      setNameError("Company name must be 100 characters or less");
      return false;
    }
    setNameError(null);
    return true;
  };

  const validateSlug = (value: string): boolean => {
    if (!value.trim()) {
      setSlugError("Slug is required");
      return false;
    }
    if (value.length > COMPANY_CONSTRAINTS.SLUG_LENGTH.max) {
      setSlugError(`Slug must be ${COMPANY_CONSTRAINTS.SLUG_LENGTH.max} characters or less`);
      return false;
    }
    if (!isValidSlug(value)) {
      setSlugError("Slug must contain only lowercase letters, numbers, and hyphens (no leading/trailing hyphens)");
      return false;
    }
    setSlugError(null);
    return true;
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (nameError) validateName(value);

    // Auto-generate slug if not manually edited (only in create mode)
    if (!company && !slugTouched) {
      const generatedSlug = generateSlug(value);
      setSlug(generatedSlug);
    }
  };

  const handleSlugChange = (value: string) => {
    setSlugTouched(true);
    // Sanitize input: lowercase and only allowed characters
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setSlug(sanitized);
    if (slugError) validateSlug(sanitized);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate
    const isNameValid = validateName(name);
    const isSlugValid = validateSlug(slug);
    if (!isNameValid || !isSlugValid) {
      return;
    }

    setIsSubmitting(true);

    try {
      let result;
      if (company) {
        // Edit mode - update existing company
        result = await updateCompanyAction(company.id, {
          name: name.trim(),
          slug: slug.trim(),
        });
      } else {
        // Create mode - create new company
        result = await createCompanyAction({
          name: name.trim(),
          slug: slug.trim(),
        });
      }

      if (result.success) {
        // Success!
        if (onSuccess) {
          onSuccess(company?.id ?? (result as { companyId?: string }).companyId ?? "");
        }
        // Reset form only if creating
        if (!company) {
          setName("");
          setSlug("");
          setSlugTouched(false);
        }
      } else {
        setError(result.error || `Failed to ${company ? "update" : "create"} company`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Company Name Input */}
      <div className="space-y-2">
        <Label htmlFor="company-name">
          Company Name <span className="text-red-500">*</span>
        </Label>
        <Input
          type="text"
          id="company-name"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          onBlur={() => validateName(name)}
          className={nameError ? "border-red-500 focus-visible:ring-red-500" : ""}
          placeholder="Acme Corp"
          disabled={isSubmitting}
          maxLength={100}
          aria-invalid={!!nameError}
          aria-describedby={nameError ? "name-error" : undefined}
        />
        {nameError && (
          <p id="name-error" className="text-sm text-red-500" role="alert">
            {nameError}
          </p>
        )}
      </div>

      {/* Company Slug Input */}
      <div className="space-y-2">
        <Label htmlFor="company-slug">
          URL Slug <span className="text-red-500">*</span>
        </Label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">/</span>
          <Input
            type="text"
            id="company-slug"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            onBlur={() => validateSlug(slug)}
            className={slugError ? "border-red-500 focus-visible:ring-red-500" : ""}
            placeholder="acme-corp"
            disabled={isSubmitting}
            maxLength={COMPANY_CONSTRAINTS.SLUG_LENGTH.max}
            aria-invalid={!!slugError}
            aria-describedby={slugError ? "slug-error" : "slug-hint"}
          />
        </div>
        {slugError ? (
          <p id="slug-error" className="text-sm text-red-500" role="alert">
            {slugError}
          </p>
        ) : (
          <p id="slug-hint" className="text-xs text-muted-foreground">
            This will be the URL path to access this company
          </p>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div
          className="p-3 text-sm text-red-700 bg-red-50 rounded-md border border-red-200"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Form Actions */}
      <div className="flex gap-3 justify-end pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? (company ? "Updating..." : "Creating...")
            : (company ? "Update Company" : "Create Company")}
        </Button>
      </div>
    </form>
  );
}
