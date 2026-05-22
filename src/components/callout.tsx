import { cn } from "@/lib/utils"

type CalloutVariant = "info" | "warning" | "success" | "danger" | "note"

const VARIANT_STYLES: Record<CalloutVariant, string> = {
  info:    "border-sky-500/30 bg-sky-500/10 text-sky-300",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  danger:  "border-red-500/30 bg-red-500/10 text-red-300",
  note:    "border-border bg-muted/50 text-muted-foreground",
}

interface CalloutProps {
  variant?: CalloutVariant
  title?: string
  children: React.ReactNode
  className?: string
}

export function Callout({
  variant = "info",
  title,
  children,
  className,
}: CalloutProps) {
  return (
    <div className={cn("rounded-lg border p-4 text-sm leading-relaxed", VARIANT_STYLES[variant], className)}>
      {title && <span className="font-semibold">{title}: </span>}
      {children}
    </div>
  )
}
