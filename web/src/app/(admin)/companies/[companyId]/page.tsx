"use client";

import { useState, useEffect, use } from "react";
import { getCompanyAction, updateCompanyAction, getCompanyEventCountAction, type Company, DeleteCompanyDialog } from "@/features/companies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface CompanyDetailPageProps {
  params: Promise<{ companyId: string }>;
}

export default function CompanyDetailPage({ params }: CompanyDetailPageProps) {
  // Unwrap params promise (Next.js 16+)
  const { companyId } = use(params);
  const [company, setCompany] = useState<Company | null>(null);
  const [eventCount, setEventCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [brandColor, setBrandColor] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [termsUrl, setTermsUrl] = useState("");
  const [privacyUrl, setPrivacyUrl] = useState("");

  // Validation errors
  const [nameError, setNameError] = useState<string | null>(null);
  const [contactEmailError, setContactEmailError] = useState<string | null>(null);
  const [termsUrlError, setTermsUrlError] = useState<string | null>(null);
  const [privacyUrlError, setPrivacyUrlError] = useState<string | null>(null);

  // Track if form has changes
  const [hasChanges, setHasChanges] = useState(false);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const loadCompany = async () => {
    setLoading(true);
    setError(null);

    try {
      const [companyResult, countResult] = await Promise.all([
        getCompanyAction(companyId),
        getCompanyEventCountAction(companyId),
      ]);

      if (companyResult.success && companyResult.company) {
        setCompany(companyResult.company);
        setName(companyResult.company.name);
        setBrandColor(companyResult.company.brandColor || "");
        setContactEmail(companyResult.company.contactEmail || "");
        setTermsUrl(companyResult.company.termsUrl || "");
        setPrivacyUrl(companyResult.company.privacyUrl || "");
      } else {
        setError(companyResult.error || "Company not found");
      }

      if (countResult.success) {
        setEventCount(countResult.count ?? 0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load company");
    } finally {
      setLoading(false);
    }
  };

  // Load company data on mount
  useEffect(() => {
    void loadCompany();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  // Track changes in form
  useEffect(() => {
    if (company) {
      const hasNameChange = name !== company.name;
      const hasBrandColorChange = brandColor !== (company.brandColor || "");
      const hasContactEmailChange = contactEmail !== (company.contactEmail || "");
      const hasTermsUrlChange = termsUrl !== (company.termsUrl || "");
      const hasPrivacyUrlChange = privacyUrl !== (company.privacyUrl || "");

      setHasChanges(
        hasNameChange ||
        hasBrandColorChange ||
        hasContactEmailChange ||
        hasTermsUrlChange ||
        hasPrivacyUrlChange
      );
    }
  }, [name, brandColor, contactEmail, termsUrl, privacyUrl, company]);

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

  const validateContactEmail = (value: string): boolean => {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setContactEmailError("Invalid email format");
      return false;
    }
    setContactEmailError(null);
    return true;
  };

  const validateTermsUrl = (value: string): boolean => {
    if (value && !/^https?:\/\/.+/.test(value)) {
      setTermsUrlError("Invalid URL format");
      return false;
    }
    setTermsUrlError(null);
    return true;
  };

  const validatePrivacyUrl = (value: string): boolean => {
    if (value && !/^https?:\/\/.+/.test(value)) {
      setPrivacyUrlError("Invalid URL format");
      return false;
    }
    setPrivacyUrlError(null);
    return true;
  };

  const handleSave = async () => {
    setError(null);
    setSaveSuccess(false);

    // Validate all fields
    const isNameValid = validateName(name);
    const isContactEmailValid = validateContactEmail(contactEmail);
    const isTermsUrlValid = validateTermsUrl(termsUrl);
    const isPrivacyUrlValid = validatePrivacyUrl(privacyUrl);

    if (!isNameValid || !isContactEmailValid || !isTermsUrlValid || !isPrivacyUrlValid) {
      return;
    }

    setSaving(true);

    try {
      const result = await updateCompanyAction(companyId, {
        name: name.trim(),
        brandColor: brandColor || undefined,
        contactEmail: contactEmail || undefined,
        termsUrl: termsUrl || undefined,
        privacyUrl: privacyUrl || undefined,
      });

      if (result.success) {
        setSaveSuccess(true);
        setHasChanges(false);
        // Reload company data to get updated timestamp
        await loadCompany();

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSaveSuccess(false);
        }, 3000);
      } else {
        setError(result.error || "Failed to update company");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading company...</p>
      </div>
    );
  }

  if (error && !company) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
        <Link href="/companies">
          <Button variant="outline" className="mt-4">
            Back to Companies
          </Button>
        </Link>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Company not found</p>
        <Link href="/companies">
          <Button variant="outline" className="mt-4">
            Back to Companies
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with back button and save button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/companies">
            <Button variant="ghost" size="icon" aria-label="Back to companies">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold">{company.name}</h2>
            <p className="text-muted-foreground mt-1">
              Edit company details
            </p>
          </div>
        </div>

        {/* Centralized Save Button - Top Right */}
        <Button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="min-w-[120px]"
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Success Message */}
      {saveSuccess && (
        <div
          className="p-3 text-sm text-green-700 bg-green-50 rounded-md border border-green-200"
          role="alert"
        >
          Company updated successfully!
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          className="p-3 text-sm text-red-700 bg-red-50 rounded-md border border-red-200"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Company Metadata - Compact row */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center justify-between gap-6 flex-wrap">
          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Status:</span>{" "}
              <span className="font-medium capitalize">{company.status}</span>
            </div>
            <div className="hidden sm:block text-muted-foreground">•</div>
            <div>
              <span className="text-muted-foreground">Created:</span>{" "}
              <span className="font-medium">
                {new Date(company.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
            <div className="hidden sm:block text-muted-foreground">•</div>
            <div>
              <span className="text-muted-foreground">Updated:</span>{" "}
              <span className="font-medium">
                {new Date(company.updatedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
          <Link href={`/events?companyId=${company.id}`}>
            <Button variant="outline" size="sm">
              View Events ({eventCount})
            </Button>
          </Link>
        </div>
      </div>

      {/* Company Details Form */}
      <div className="border rounded-lg p-6 space-y-6">
        <div className="space-y-4">
          {/* Company Name */}
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
              disabled={saving}
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

          {/* Brand Color */}
          <div className="space-y-2">
            <Label htmlFor="brand-color">Brand Color</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                id="brand-color"
                value={brandColor || "#0EA5E9"}
                onChange={(e) => setBrandColor(e.target.value)}
                className="h-12 w-20 border border-input rounded-md cursor-pointer"
                disabled={saving}
              />
              <Input
                type="text"
                value={brandColor || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  if (!value || /^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                    setBrandColor(value);
                  }
                }}
                className="flex-1 font-mono"
                placeholder="#0EA5E9"
                disabled={saving}
                maxLength={7}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Brand color for customization (optional)
            </p>
          </div>

          {/* Contact Email */}
          <div className="space-y-2">
            <Label htmlFor="contact-email">Contact Email</Label>
            <Input
              type="email"
              id="contact-email"
              value={contactEmail}
              onChange={(e) => {
                setContactEmail(e.target.value);
                if (contactEmailError) validateContactEmail(e.target.value);
              }}
              onBlur={() => validateContactEmail(contactEmail)}
              className={contactEmailError ? "border-red-500 focus-visible:ring-red-500" : ""}
              placeholder="contact@company.com"
              disabled={saving}
              aria-invalid={!!contactEmailError}
              aria-describedby={contactEmailError ? "email-error" : undefined}
            />
            {contactEmailError && (
              <p id="email-error" className="text-sm text-red-500" role="alert">
                {contactEmailError}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Contact email for this company (optional)
            </p>
          </div>

          {/* Terms URL */}
          <div className="space-y-2">
            <Label htmlFor="terms-url">Terms of Service URL</Label>
            <Input
              type="url"
              id="terms-url"
              value={termsUrl}
              onChange={(e) => {
                setTermsUrl(e.target.value);
                if (termsUrlError) validateTermsUrl(e.target.value);
              }}
              onBlur={() => validateTermsUrl(termsUrl)}
              className={termsUrlError ? "border-red-500 focus-visible:ring-red-500" : ""}
              placeholder="https://company.com/terms"
              disabled={saving}
              aria-invalid={!!termsUrlError}
              aria-describedby={termsUrlError ? "terms-error" : undefined}
            />
            {termsUrlError && (
              <p id="terms-error" className="text-sm text-red-500" role="alert">
                {termsUrlError}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Link to terms of service (optional)
            </p>
          </div>

          {/* Privacy URL */}
          <div className="space-y-2">
            <Label htmlFor="privacy-url">Privacy Policy URL</Label>
            <Input
              type="url"
              id="privacy-url"
              value={privacyUrl}
              onChange={(e) => {
                setPrivacyUrl(e.target.value);
                if (privacyUrlError) validatePrivacyUrl(e.target.value);
              }}
              onBlur={() => validatePrivacyUrl(privacyUrl)}
              className={privacyUrlError ? "border-red-500 focus-visible:ring-red-500" : ""}
              placeholder="https://company.com/privacy"
              disabled={saving}
              aria-invalid={!!privacyUrlError}
              aria-describedby={privacyUrlError ? "privacy-error" : undefined}
            />
            {privacyUrlError && (
              <p id="privacy-error" className="text-sm text-red-500" role="alert">
                {privacyUrlError}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Link to privacy policy (optional)
            </p>
          </div>
        </div>
      </div>

      {/* Danger Zone - Delete Company */}
      <div className="border rounded-lg border-red-200 p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-red-600">Danger Zone</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Permanently delete this company. This action cannot be undone.
          </p>
        </div>
        <Button
          variant="destructive"
          onClick={() => setDeleteDialogOpen(true)}
          disabled={saving}
          className="min-h-[44px]"
        >
          Delete Company
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      {company && (
        <DeleteCompanyDialog
          companyId={company.id}
          companyName={company.name}
          eventCount={eventCount}
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
        />
      )}
    </div>
  );
}
