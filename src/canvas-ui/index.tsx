import {
  type CSSProperties,
  type InputHTMLAttributes,
  type MouseEventHandler,
  type ReactNode,
  useMemo,
} from "react"
import { useLocalStorageState } from "@/hooks/use-local-storage-state"

const palette = {
  foreground: "#E4E4E4EB",
  foregroundSecondary: "#E4E4E48D",
  foregroundTertiary: "#E4E4E45E",
  foregroundQuaternary: "#E4E4E442",
  editor: "#181818",
  chrome: "#141414",
  sidebar: "#141414",
  elevated: "#181818",
  fillPrimary: "#E4E4E430",
  fillSecondary: "#E4E4E41E",
  fillTertiary: "#E4E4E411",
  fillQuaternary: "#E4E4E40A",
  strokePrimary: "#E4E4E433",
  strokeSecondary: "#E4E4E41F",
  strokeTertiary: "#E4E4E414",
  accent: "#599CE7",
  buttonBackground: "#599CE7",
  buttonForeground: "#191c22",
  buttonHoverBackground: "#6AABE9",
  link: "#87c3ff",
} as const

const tokens = {
  bg: { editor: palette.editor, chrome: palette.chrome, elevated: palette.elevated },
  text: {
    primary: palette.foreground,
    secondary: palette.foregroundSecondary,
    tertiary: palette.foregroundTertiary,
    quaternary: palette.foregroundQuaternary,
    link: palette.link,
    onAccent: palette.buttonForeground,
  },
  stroke: {
    primary: palette.strokePrimary,
    secondary: palette.strokeSecondary,
    tertiary: palette.strokeTertiary,
  },
  fill: {
    primary: palette.fillPrimary,
    secondary: palette.fillSecondary,
    tertiary: palette.fillTertiary,
    quaternary: palette.fillQuaternary,
  },
  accent: {
    primary: palette.accent,
    control: palette.buttonBackground,
    controlHover: palette.buttonHoverBackground,
  },
  diff: {
    insertedLine: "#3FA26633",
    removedLine: "#B8004933",
    removed: "#B8004933",
    stripAdded: "#3FA2668F",
    stripRemoved: "#FC6B838F",
  },
} as const

export type CanvasHostTheme = typeof tokens & {
  kind: "dark"
  tokens: typeof tokens
  palette: typeof palette
}

export function useHostTheme(): CanvasHostTheme {
  return useMemo(
    () => ({ ...tokens, kind: "dark", tokens, palette }),
    [],
  )
}

export type SetCanvasState<T> = (action: T | ((prev: T) => T)) => void

export function useCanvasState<T>(key: string, defaultValue: T): [T, SetCanvasState<T>] {
  return useLocalStorageState<T>(`canvas:${key}`, defaultValue)
}

export function mergeStyle(base: CSSProperties, override?: CSSProperties): CSSProperties {
  return override ? { ...base, ...override } : base
}

const toneText = (tone: "primary" | "secondary" | "tertiary" | "quaternary" = "primary") =>
  ({ primary: tokens.text.primary, secondary: tokens.text.secondary, tertiary: tokens.text.tertiary, quaternary: tokens.text.quaternary })[tone]

export function Stack({ children, gap = 0, style }: { children?: ReactNode; gap?: number; style?: CSSProperties }) {
  return <div style={{ display: "flex", flexDirection: "column", gap, ...style }}>{children}</div>
}

const rowAlign = { start: "flex-start", center: "center", end: "flex-end", stretch: "stretch" } as const
const rowJustify = { start: "flex-start", center: "center", end: "flex-end", "space-between": "space-between" } as const

export function Row({
  children,
  gap = 0,
  align = "stretch",
  justify = "start",
  wrap,
  style,
}: {
  children?: ReactNode
  gap?: number
  align?: "start" | "center" | "end" | "stretch"
  justify?: "start" | "center" | "end" | "space-between" | "between"
  wrap?: boolean
  style?: CSSProperties
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: rowAlign[align],
        justifyContent: rowJustify[justify === "between" ? "space-between" : justify],
        gap,
        flexWrap: wrap ? "wrap" : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function Grid({
  children,
  columns,
  gap = 0,
  align = "stretch",
  style,
}: {
  children?: ReactNode
  columns: number | string
  gap?: number
  align?: "start" | "center" | "end" | "stretch"
  style?: CSSProperties
}) {
  const cols = typeof columns === "number" ? `repeat(${columns}, minmax(0, 1fr))` : columns
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: cols,
        gap,
        alignItems: rowAlign[align],
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function Divider({ style }: { style?: CSSProperties }) {
  return <hr style={{ border: "none", borderTop: `1px solid ${tokens.stroke.tertiary}`, margin: 0, ...style }} />
}

export function Spacer() {
  return <div style={{ flex: 1, minWidth: 0 }} />
}

export function Text({
  children,
  tone = "primary",
  size = "body",
  weight = "normal",
  italic,
  truncate,
  style,
}: {
  children?: ReactNode
  tone?: "primary" | "secondary" | "tertiary" | "quaternary"
  size?: "body" | "small"
  weight?: "normal" | "medium" | "semibold" | "bold"
  italic?: boolean
  truncate?: boolean | "start" | "end"
  style?: CSSProperties
}) {
  const weights = { normal: 400, medium: 500, semibold: 600, bold: 700 }
  const truncateStyle: CSSProperties =
    truncate === "start"
      ? { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", direction: "rtl", textAlign: "left" }
      : truncate
        ? { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }
        : {}
  return (
    <p
      style={{
        margin: 0,
        color: toneText(tone),
        fontSize: size === "small" ? 11 : 13,
        fontWeight: weights[weight],
        fontStyle: italic ? "italic" : undefined,
        lineHeight: 1.45,
        ...truncateStyle,
        ...style,
      }}
    >
      {children}
    </p>
  )
}

export function H1({ children, style }: { children?: ReactNode; style?: CSSProperties }) {
  return <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: tokens.text.primary, ...style }}>{children}</h1>
}

export function H2({ children, style }: { children?: ReactNode; style?: CSSProperties }) {
  return <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: tokens.text.primary, ...style }}>{children}</h2>
}

export function H3({ children, style }: { children?: ReactNode; style?: CSSProperties }) {
  return <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: tokens.text.primary, ...style }}>{children}</h3>
}

export function Link({ children, href, style }: { children?: ReactNode; href: string; style?: CSSProperties }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" style={{ color: tokens.text.link, textDecoration: "none", ...style }}>
      {children}
    </a>
  )
}

export function Card({ children, style }: { children?: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        border: `1px solid ${tokens.stroke.secondary}`,
        borderRadius: 6,
        background: tokens.bg.elevated,
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function CardBody({ children, style }: { children?: ReactNode; style?: CSSProperties }) {
  return <div style={{ padding: 12, ...style }}>{children}</div>
}

export function Button({
  children,
  variant = "primary",
  disabled,
  type = "button",
  style,
  title,
  onClick,
}: {
  children?: ReactNode
  variant?: "primary" | "secondary" | "ghost"
  disabled?: boolean
  type?: "button" | "submit" | "reset"
  style?: CSSProperties
  title?: string
  onClick?: MouseEventHandler<HTMLButtonElement>
}) {
  const base: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 24,
    padding: "0 10px",
    borderRadius: 4,
    border: "none",
    fontSize: 12,
    fontWeight: 500,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    whiteSpace: "nowrap",
  }
  const variants: Record<string, CSSProperties> = {
    primary: { background: tokens.accent.control, color: tokens.text.onAccent },
    secondary: {
      background: tokens.fill.secondary,
      color: tokens.text.primary,
      border: `1px solid ${tokens.stroke.secondary}`,
    },
    ghost: { background: "transparent", color: tokens.text.secondary },
  }
  return (
    <button type={type} disabled={disabled} title={title} onClick={onClick} style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  )
}

const pillTones: Record<string, { border: string; text: string; bg?: string }> = {
  neutral: { border: tokens.stroke.secondary, text: tokens.text.secondary },
  success: { border: "#3FA266", text: "#3FA266", bg: "#3FA26622" },
  warning: { border: "#E8C030", text: "#E8C030", bg: "#E8C03022" },
  info: { border: tokens.accent.primary, text: tokens.accent.primary, bg: "#599CE722" },
}

export function Pill({
  children,
  active,
  tone = "neutral",
  size = "md",
  disabled,
  style,
  onClick,
}: {
  children?: ReactNode
  active?: boolean
  tone?: "neutral" | "added" | "deleted" | "renamed" | "success" | "warning" | "info"
  size?: "sm" | "md"
  disabled?: boolean
  style?: CSSProperties
  onClick?: () => void
}) {
  const t = pillTones[tone] ?? pillTones.neutral
  const isSm = size === "sm"
  const shared: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    fontSize: isSm ? 10 : 11,
    fontWeight: 500,
    padding: isSm ? "2px 8px" : "3px 10px",
    border: isSm ? "none" : `1px solid ${t.border}`,
    color: active ? tokens.text.primary : t.text,
    background: active ? tokens.fill.primary : t.bg ?? "transparent",
    cursor: onClick && !disabled ? "pointer" : "default",
    opacity: disabled ? 0.5 : 1,
  }
  if (onClick) {
    return (
      <button type="button" disabled={disabled} onClick={onClick} style={{ ...shared, ...style }}>
        {children}
      </button>
    )
  }
  return <span style={{ ...shared, ...style }}>{children}</span>
}

const calloutTones: Record<string, { border: string; bg: string; title: string }> = {
  info: { border: tokens.accent.primary, bg: "#599CE718", title: tokens.accent.primary },
  success: { border: "#3FA266", bg: "#3FA26618", title: "#3FA266" },
  warning: { border: "#E8C030", bg: "#E8C03018", title: "#E8C030" },
  danger: { border: "#FC6B83", bg: "#FC6B8318", title: "#FC6B83" },
  neutral: { border: tokens.stroke.secondary, bg: tokens.fill.quaternary, title: tokens.text.primary },
}

export function Callout({
  children,
  tone = "neutral",
  title,
  style,
}: {
  children?: ReactNode
  tone?: "info" | "success" | "warning" | "danger" | "neutral"
  title?: ReactNode
  style?: CSSProperties
}) {
  const t = calloutTones[tone]
  return (
    <div
      style={{
        border: `1px solid ${t.border}`,
        borderRadius: 6,
        background: t.bg,
        padding: "10px 12px",
        ...style,
      }}
    >
      {title ? <div style={{ fontWeight: 600, fontSize: 12, color: t.title, marginBottom: 4 }}>{title}</div> : null}
      <div style={{ fontSize: 12, color: tokens.text.secondary, lineHeight: 1.45 }}>{children}</div>
    </div>
  )
}

export type TextInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> & {
  value?: string
  onChange?: (value: string) => void
}

export function TextInput({ value = "", onChange, style, ...rest }: TextInputProps) {
  const theme = useHostTheme()
  return (
    <input
      {...rest}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      style={{
        height: 28,
        width: "100%",
        boxSizing: "border-box",
        padding: "0 8px",
        borderRadius: 4,
        border: `1px solid ${theme.stroke.secondary}`,
        background: theme.bg.editor,
        color: theme.text.primary,
        fontSize: 12,
        outline: "none",
        ...style,
      }}
    />
  )
}

export function Checkbox({
  checked = false,
  onChange,
  disabled,
  label,
  style,
}: {
  checked?: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
  label?: ReactNode
  style?: CSSProperties
}) {
  const theme = useHostTheme()
  const box = (
    <span
      role="checkbox"
      aria-checked={checked}
      onClick={() => !disabled && onChange?.(!checked)}
      style={{
        width: 14,
        height: 14,
        borderRadius: 3,
        border: `1px solid ${checked ? theme.accent.primary : theme.stroke.secondary}`,
        background: checked ? theme.accent.primary : "transparent",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: disabled ? "not-allowed" : "pointer",
        flexShrink: 0,
        fontSize: 10,
        color: theme.text.onAccent,
      }}
    >
      {checked ? "✓" : null}
    </span>
  )
  if (label) {
    return (
      <label style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", ...style }}>
        {box}
        <span style={{ fontSize: 12, color: theme.text.primary }}>{label}</span>
      </label>
    )
  }
  return box
}

export function Table({
  headers,
  rows,
  columnAlign,
  framed = true,
  style,
  emptyMessage = "No rows",
}: {
  headers: ReactNode[]
  rows: ReactNode[][]
  columnAlign?: Array<"left" | "center" | "right" | undefined>
  framed?: boolean
  style?: CSSProperties
  emptyMessage?: ReactNode
}) {
  const theme = useHostTheme()
  const alignCss = (i: number): CSSProperties["textAlign"] =>
    ({ left: "left", center: "center", right: "right" } as const)[columnAlign?.[i] ?? "left"]
  return (
    <div
      style={{
        border: framed ? `1px solid ${theme.stroke.secondary}` : undefined,
        borderRadius: framed ? 6 : undefined,
        overflow: "auto",
        ...style,
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
        <thead>
          <tr style={{ background: theme.fill.quaternary }}>
            {headers.map((h, i) => (
              <th
                key={i}
                style={{
                  textAlign: alignCss(i),
                  padding: "6px 10px",
                  color: theme.text.secondary,
                  fontWeight: 600,
                  borderBottom: `1px solid ${theme.stroke.tertiary}`,
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} style={{ padding: 12, color: theme.text.tertiary, textAlign: "center" }}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, ri) => (
              <tr key={ri}>
                {headers.map((_, ci) => (
                  <td
                    key={ci}
                    style={{
                      textAlign: alignCss(ci),
                      padding: "6px 10px",
                      color: theme.text.primary,
                      borderBottom: `1px solid ${theme.stroke.tertiary}`,
                    }}
                  >
                    {row[ci] ?? null}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
