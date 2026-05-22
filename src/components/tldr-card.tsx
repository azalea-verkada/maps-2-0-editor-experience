import { cn } from "@/lib/utils"

interface TldrCardProps {
  items: string[]
  title?: string
  className?: string
}

export function TldrCard({ items, title = "TL;DR", className }: TldrCardProps) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-5 mb-8", className)}>
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        {title}
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2.5 text-sm leading-relaxed">
            <span className="shrink-0 text-muted-foreground/40 font-mono mt-px">–</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
