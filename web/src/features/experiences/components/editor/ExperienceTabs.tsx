"use client";

import { InlineTabs, type TabItem } from "@/components/shared";

interface ExperienceTabsProps {
  companySlug: string;
  experienceId: string;
}

export function ExperienceTabs({ companySlug, experienceId }: ExperienceTabsProps) {
  const tabs: TabItem[] = [
    { label: "Design", href: `/${companySlug}/exps/${experienceId}/design` },
    { label: "Settings", href: `/${companySlug}/exps/${experienceId}/settings` },
  ];

  return <InlineTabs tabs={tabs} ariaLabel="Experience sections" />;
}