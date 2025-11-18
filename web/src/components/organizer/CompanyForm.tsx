"use client";

import { useState, useEffect } from "react";
import { createCompanyAction, updateCompanyAction } from "@/lib/actions/companies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Company } from "@/lib/types/firestore";

interface CompanyFormProps {
  company?: Company; // If provided, form is in edit mode
  onSuccess?: (companyId: string) => void;
  onCancel?: () => void;
}

export function CompanyForm({ company, onSuccess, onCancel }: CompanyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");

  // Validation errors
  const [nameError, setNameError] = useState<string | null>(null);

  // Initialize form with company data if in edit mode
  useEffect(() => {
    if (company) {
      setName(company.name);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate
    const isNameValid = validateName(name);
    if (!isNameValid) {
      return;
    }

    setIsSubmitting(true);

    try {
      let result;
      if (company) {
        // Edit mode - update existing company
        result = await updateCompanyAction(company.id, {
          name: name.trim(),
        });
      } else {
        // Create mode - create new company
        result = await createCompanyAction({
          name: name.trim(),
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
          onChange={(e) => {
            setName(e.target.value);
            if (nameError) validateName(e.target.value);
          }}
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
