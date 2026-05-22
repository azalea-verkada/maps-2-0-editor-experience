import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

interface Stat {
  label: string
  value: string | number
}

interface PageHeaderProps {
  title: string | React.ReactNode
  subtitle?: string
  backHref?: string
  backLabel?: string
  type?: string
  createdDate?: string
  modifiedDate?: string
  gradient?: string
  stats?: Stat[]
  className?: string
}

export function PageHeader({
  title,
  subtitle,
  backHref = "https://ankush-rustagi.github.io/",
  backLabel = "Back to index",
  type,
  createdDate,
  modifiedDate,
  gradient,
  stats,
  className,
}: PageHeaderProps) {
  return (
    <>
      {gradient && (
        <div
          aria-hidden
          className="fixed inset-x-0 top-0 h-64 -z-10 opacity-30 pointer-events-none"
          style={{ background: gradient }}
        />
      )}

      <a
        href={backHref}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="size-4" />
        {backLabel}
      </a>

      <header className={cn("mb-8", className)}>
        {type && (
          <span className="inline-flex items-center rounded border border-border bg-muted/50 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground mb-3">
            {type}
          </span>
        )}

        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight leading-tight mb-2">
          {title}
        </h1>

        {subtitle && (
          <p className="text-muted-foreground max-w-2xl leading-relaxed">{subtitle}</p>
        )}

        {(createdDate || modifiedDate || stats) && (
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-border/60 text-xs text-muted-foreground">
            {createdDate && (
              <span>
                <span className="text-muted-foreground/50 mr-1">Created</span>
                {createdDate}
              </span>
            )}
            {modifiedDate && (
              <span>
                <span className="text-muted-foreground/50 mr-1">Updated</span>
                {modifiedDate}
              </span>
            )}
            {stats?.map(s => (
              <span key={s.label}>
                <span className="font-semibold text-foreground">{s.value}</span>
                {" "}
                <span className="text-muted-foreground/70">{s.label}</span>
              </span>
            ))}
          </div>
        )}
      </header>
    </>
  )
}
