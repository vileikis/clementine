"use client";

import Link from "next/link";
import type { Company } from "../types";

interface CompanyCardProps {
  company: Company;
}

/**
 * Company card component for displaying company information in lists
 * Links to company workspace via slug
 * @param company - Company data to display
 */
export function CompanyCard({ company }: CompanyCardProps) {
  const formattedDate = new Date(company.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Link href={`/${company.slug}`}>
      <div className="border rounded-lg p-6 space-y-4 hover:bg-muted/50 transition-colors cursor-pointer">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold truncate">{company.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">/{company.slug}</p>
          </div>
        </div>

        {/* Metadata */}
        <div className="text-xs text-muted-foreground">
          Created {formattedDate}
        </div>
      </div>
    </Link>
  );
}
