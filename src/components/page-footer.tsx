import { cn } from "@/lib/utils"

interface PageFooterProps {
  author?: string
  org?: string
  builtDate?: string
  extra?: string
  className?: string
}

export function PageFooter({
  author = "Ankush Rustagi",
  org = "Verkada Product",
  builtDate,
  extra,
  className,
}: PageFooterProps) {
  const parts = [author, org, builtDate ? `Canvas built ${builtDate}` : undefined, extra].filter(Boolean)
  return (
    <footer className={cn("mt-20 pt-6 border-t border-border text-xs text-muted-foreground", className)}>
      {parts.join(" · ")}
    </footer>
  )
}
