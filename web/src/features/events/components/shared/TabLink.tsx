"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface TabLinkProps {
  href: string
  children: React.ReactNode
}

export function TabLink({ href, children }: TabLinkProps) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <li>
      <Link
        href={href}
        className={cn(
          "inline-block pb-4 border-b-2 transition-colors",
          isActive
            ? "border-foreground font-medium"
            : "border-transparent hover:border-muted-foreground"
        )}
      >
        {children}
      </Link>
    </li>
  )
}
