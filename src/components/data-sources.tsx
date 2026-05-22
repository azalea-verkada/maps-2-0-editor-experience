import { cn } from "@/lib/utils"

interface DataSource {
  label: string
  description: string
}

interface DataSourcesProps {
  sources: DataSource[]
  methodology?: string
  asOf?: string
  className?: string
}

export function DataSources({ sources, methodology, asOf, className }: DataSourcesProps) {
  return (
    <section className={cn("mt-16 pt-6 border-t border-border", className)}>
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
        Data Sources &amp; Methodology
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {sources.map(s => (
          <div key={s.label} className="rounded-lg border border-border bg-card px-4 py-3">
            <div className="text-xs font-medium text-foreground mb-0.5">{s.label}</div>
            <p className="text-xs text-muted-foreground leading-relaxed">{s.description}</p>
          </div>
        ))}
      </div>
      {methodology && (
        <p className="text-xs text-muted-foreground leading-relaxed mb-2">{methodology}</p>
      )}
      {asOf && (
        <p className="text-[11px] text-muted-foreground/50">Data as of {asOf}</p>
      )}
    </section>
  )
}
