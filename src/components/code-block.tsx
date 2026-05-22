import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { cn } from "@/lib/utils"

interface CodeBlockProps {
  children: string
  lang?: string
  className?: string
}

export function CodeBlock({ children, lang = "plaintext", className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(children).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className={cn("rounded-xl border border-border bg-muted/30 overflow-x-auto", className)}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
        <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
          {lang}
        </span>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? (
            <><Check className="size-3 text-emerald-400" />Copied</>
          ) : (
            <><Copy className="size-3" />Copy</>
          )}
        </button>
      </div>
      <pre className="p-4 text-xs text-muted-foreground font-mono leading-relaxed overflow-x-auto whitespace-pre">
        {children}
      </pre>
    </div>
  )
}
