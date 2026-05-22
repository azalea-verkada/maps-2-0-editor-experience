import { useCallback } from "react"
import { cn } from "@/lib/utils"
import { Callout } from "@/components/callout"
import { useLocalStorageState } from "@/hooks/use-local-storage-state"

// ─── Types ────────────────────────────────────────────────────────────────────

type RailId = "map" | "locations" | "collections" | "layers" | "recents"
type PlaceTab = "overview" | "markers" | "activity" | "about"
type EditorTool = "Select" | "Wall" | "Door" | "Window" | "Camera" | "Sensor" | "Cable" | "Ruler" | "Area" | "Label"
type EditorEntry = "none" | "manage-home" | "in-context"
type EditorRightTab = "tools" | "devices" | "properties"
type WorkspaceFocus = "editor" | "full"
type CollTab = "mine" | "shared" | "following"

type MockLocation = {
  id: string
  label: string
  kind: "location" | "building" | "floor"
  site: string
  online: number
  total: number
  depth: number
}

type MockMarker = {
  id: string
  label: string
  kind: "Camera" | "Access Control"
  model: string
  status: "Online" | "Offline"
  x: number
  y: number
}

type AppState = {
  rail: RailId
  searchFocused: boolean
  searchQuery: string
  selectedPlaceId: string | null
  placeTab: PlaceTab
  editorMode: boolean
  editorEntry: EditorEntry
  editorTool: EditorTool
  editorRightTab: EditorRightTab
  selectedMarkerId: string | null
  stampActive: boolean
  showFovCones: boolean
  undoCount: number
  redoCount: number
  activeLayers: string[]
  expandedCollectionId: string | null
  collTab: CollTab
  sitePickerOpen: boolean
  filesFlyoutOpen: boolean
  layersClusterOpen: boolean
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const LOCATIONS: MockLocation[] = [
  { id: "hq", label: "HQ Campus", kind: "location", site: "HQ-MAIN", online: 143, total: 156, depth: 0 },
  { id: "main-bldg", label: "Main Building", kind: "building", site: "HQ-MAIN", online: 80, total: 87, depth: 1 },
  { id: "floor-3", label: "Floor 3", kind: "floor", site: "HQ-MAIN", online: 42, total: 45, depth: 2 },
  { id: "east-campus", label: "East Campus", kind: "location", site: "EC-01", online: 65, total: 69, depth: 0 },
  { id: "warehouse-a", label: "Warehouse A", kind: "location", site: "WH-01", online: 23, total: 23, depth: 0 },
]

const MARKERS: MockMarker[] = [
  { id: "cam-lobby-01", label: "Cam-Lobby-01", kind: "Camera", model: "CD52", status: "Online", x: 55, y: 35 },
  { id: "cam-ne-01", label: "Cam-NE-01", kind: "Camera", model: "CD31", status: "Online", x: 65, y: 55 },
  { id: "cam-sw-04", label: "Cam-SW-04", kind: "Camera", model: "CD52", status: "Offline", x: 75, y: 42 },
  { id: "door-007", label: "Door-007", kind: "Access Control", model: "AC42", status: "Online", x: 58, y: 68 },
  { id: "cam-nw-02", label: "Cam-NW-02", kind: "Camera", model: "CD31", status: "Online", x: 70, y: 72 },
]

const COLLECTIONS = [
  { id: "hq-ext", label: "HQ External Cameras", count: 12, owned: true, shared: false },
  { id: "door-audit", label: "Door Access Audit", count: 8, owned: true, shared: false },
  { id: "parking-a", label: "Parking Zone A", count: 4, owned: false, shared: true },
]

const LAYER_GROUPS: Record<string, string[]> = {
  "Devices & Entities": ["Cameras", "Access Control", "Alarms", "Sensors"],
  Visualizations: ["Device Status", "Coverage", "Events & Alerts", "Foot Traffic"],
}

const RAIL_ITEMS: { id: RailId; abbr: string; label: string }[] = [
  { id: "map", abbr: "M", label: "Map" },
  { id: "locations", abbr: "L", label: "Locations" },
  { id: "collections", abbr: "C", label: "Collections" },
  { id: "layers", abbr: "Ly", label: "Layers" },
  { id: "recents", abbr: "R", label: "Recents" },
]

const PLACE_TABS: PlaceTab[] = ["overview", "markers", "activity", "about"]

const EDITOR_TOOL_GROUPS: { label: string; tools: EditorTool[] }[] = [
  { label: "Structural", tools: ["Wall", "Door", "Window"] },
  { label: "Devices", tools: ["Camera", "Sensor"] },
  { label: "Paths & measure", tools: ["Cable", "Ruler"] },
  { label: "Space & labels", tools: ["Area", "Label"] },
]

const EDITOR_TOOLS: EditorTool[] = ["Select", ...EDITOR_TOOL_GROUPS.flatMap((g) => g.tools)]

const UNPLACED_DEVICES = [
  { id: "d1", label: "CD52 · Lobby cam", site: "HQ-MAIN", family: "Cameras" },
  { id: "d2", label: "AC42 · Main entry", site: "HQ-MAIN", family: "Doors" },
  { id: "d3", label: "SV23 · Server room", site: "HQ-MAIN", family: "Sensors" },
  { id: "d4", label: "CD31 · NE corner", site: "HQ-MAIN", family: "Cameras" },
]

const MANAGE_HOME_ROWS = [
  { building: "Main Building", floor: "Floor 3", status: "In progress", contractor: "CDMX-04", devices: "42/45" },
  { building: "Main Building", floor: "Floor 2", status: "Complete", contractor: "CDMX-02", devices: "38/38" },
  { building: "East Wing", floor: "Floor 1", status: "Not started", contractor: "—", devices: "0/12" },
]

const EDITOR_DEFAULT: AppState = {
  rail: "map",
  searchFocused: false,
  searchQuery: "",
  selectedPlaceId: "floor-3",
  placeTab: "overview",
  editorMode: true,
  editorEntry: "in-context",
  editorTool: "Select",
  editorRightTab: "tools",
  selectedMarkerId: null,
  stampActive: false,
  showFovCones: false,
  undoCount: 3,
  redoCount: 0,
  activeLayers: ["Device Status"],
  expandedCollectionId: null,
  collTab: "mine",
  sitePickerOpen: false,
  filesFlyoutOpen: false,
  layersClusterOpen: false,
}

const DEFAULT_STATE: AppState = { ...EDITOR_DEFAULT, editorMode: false, editorEntry: "none", selectedPlaceId: null }

const EDITOR_PRESETS: { id: string; label: string; description: string; state: Partial<AppState> }[] = [
  {
    id: "manage-home",
    label: "1 · Manage Maps home",
    description: "Admin entry: org floorplan inventory, completion status, contractor assignment.",
    state: { ...EDITOR_DEFAULT, editorMode: false, editorEntry: "manage-home", selectedPlaceId: null },
  },
  {
    id: "entry-place",
    label: "2 · Entry from Place card",
    description: "Viewer on Floor 3; Open in Editor promotes to edit mode without route change.",
    state: { ...EDITOR_DEFAULT, editorMode: false, editorEntry: "none", placeTab: "overview" },
  },
  {
    id: "editor-idle",
    label: "3 · Editor idle (Select)",
    description: "In-context edit. Right panel shows tool groups. Left panel lists unplaced devices.",
    state: { ...EDITOR_DEFAULT, editorTool: "Select", editorRightTab: "tools", selectedMarkerId: null },
  },
  {
    id: "editor-wall",
    label: "4 · Wall tool",
    description: "Vector line segments, snap-to-grid. PRD P0 structural drawing.",
    state: { ...EDITOR_DEFAULT, editorTool: "Wall", editorRightTab: "properties", selectedMarkerId: null },
  },
  {
    id: "editor-door",
    label: "5 · Door tool",
    description: "Door placement on wall segment with width + swing direction.",
    state: { ...EDITOR_DEFAULT, editorTool: "Door", editorRightTab: "properties" },
  },
  {
    id: "editor-camera-stamp",
    label: "6 · Camera stamp",
    description: "Click-to-place device tokens. Left panel filters commissioned cameras.",
    state: {
      ...EDITOR_DEFAULT,
      editorTool: "Camera",
      editorRightTab: "devices",
      stampActive: true,
      selectedMarkerId: null,
    },
  },
  {
    id: "editor-fov",
    label: "7 · FOV adjust",
    description: "Drag handles on selected camera cone. Respects occlusion when toggled.",
    state: {
      ...EDITOR_DEFAULT,
      editorTool: "Camera",
      editorRightTab: "properties",
      selectedMarkerId: "cam-lobby-01",
      showFovCones: true,
    },
  },
  {
    id: "editor-cable",
    label: "8 · Cable path",
    description: "Polygon line tool, autosnap to device endpoints, verify controller association.",
    state: { ...EDITOR_DEFAULT, editorTool: "Cable", editorRightTab: "properties" },
  },
  {
    id: "editor-ruler",
    label: "9 · Ruler",
    description: "Measurement lines carried forward from Site Planner ruler mode.",
    state: { ...EDITOR_DEFAULT, editorTool: "Ruler", editorRightTab: "properties" },
  },
  {
    id: "editor-area",
    label: "10 · Area / zone",
    description: "Create, name, and reshape named polygons (Lobby, Server room).",
    state: { ...EDITOR_DEFAULT, editorTool: "Area", editorRightTab: "properties" },
  },
  {
    id: "editor-label",
    label: "11 · Label",
    description: "Room names, entry/exit points as annotation tokens.",
    state: { ...EDITOR_DEFAULT, editorTool: "Label", editorRightTab: "properties" },
  },
  {
    id: "editor-marker",
    label: "12 · Device selected",
    description: "Properties inspector: model, orientation, delete. Bulk edit when multi-select.",
    state: {
      ...EDITOR_DEFAULT,
      editorTool: "Select",
      editorRightTab: "properties",
      selectedMarkerId: "cam-lobby-01",
    },
  },
  {
    id: "editor-scale",
    label: "13 · Scale & align",
    description: "Attach raster floorplan, set scale, align walls to blueprint perimeter.",
    state: { ...EDITOR_DEFAULT, editorTool: "Select", editorRightTab: "properties", filesFlyoutOpen: true },
  },
  {
    id: "editor-drop",
    label: "14 · Dragover upload",
    description: "Full-bleed drop hint on map when files drag over an open Place.",
    state: { ...EDITOR_DEFAULT, editorMode: false, editorEntry: "none", placeTab: "overview" },
  },
]

const VIEWER_PRESETS: { id: string; label: string; description: string; state: Partial<AppState> }[] = [
  {
    id: "null",
    label: "V · Null state",
    description: "Pure map. Site + Alerts cluster, no editor chrome.",
    state: { ...DEFAULT_STATE },
  },
  {
    id: "place",
    label: "V · Place card",
    description: "Hero + action bar before editor entry.",
    state: { ...DEFAULT_STATE, selectedPlaceId: "floor-3", placeTab: "overview" },
  },
  {
    id: "files",
    label: "V · Files flyout",
    description: "Upload path for unplaced floorplans.",
    state: { ...DEFAULT_STATE, filesFlyoutOpen: true },
  },
]

const PRESET_STATES = [...EDITOR_PRESETS, ...VIEWER_PRESETS]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mergeAppState(base: AppState, patch: Partial<AppState>): AppState {
  return { ...base, ...patch }
}

function stateLabel(s: AppState): string {
  const place = LOCATIONS.find((l) => l.id === s.selectedPlaceId)
  const marker = MARKERS.find((m) => m.id === s.selectedMarkerId)
  if (s.editorEntry === "manage-home") return "manage maps home"
  if (s.editorMode && marker) return `editor › ${marker.label} › properties`
  if (s.editorMode && s.stampActive) return `editor › ${s.editorTool} stamp`
  if (s.editorMode) return `editor › ${s.editorTool} › ${s.editorRightTab}`
  if (s.filesFlyoutOpen) return "files flyout"
  if (s.sitePickerOpen) return "site picker open"
  if (place) return `viewer › ${place.label} › ${s.placeTab}`
  if (s.searchFocused) return `search${s.searchQuery ? ` › "${s.searchQuery}"` : " (open)"}`
  if (s.layersClusterOpen) return `${s.rail} rail + layers cluster`
  return `${s.rail} rail`
}

function btnClass(variant: "primary" | "secondary" | "ghost", extra?: string) {
  return cn(
    "rounded border px-2 py-0.5 text-[10px] transition-colors",
    variant === "primary" && "border-sky-500/30 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20",
    variant === "secondary" && "border-border bg-muted/50 hover:border-foreground/40",
    variant === "ghost" && "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40",
    extra,
  )
}

function Chip({ label, tone }: { label: string; tone?: "accent" | "success" | "warning" | "danger" | "neutral" }) {
  const cls = {
    accent: "border-sky-500/30 bg-sky-500/10 text-sky-300",
    success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    warning: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    danger: "border-red-500/30 bg-red-500/10 text-red-300",
    neutral: "border-border bg-muted/50 text-muted-foreground",
  }[tone ?? "neutral"]
  return <span className={cn("inline-block rounded-full border px-1.5 py-px text-[10px] leading-tight", cls)}>{label}</span>
}

function WireBox({ className, style, children, onClick, title }: {
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
  onClick?: () => void
  title?: string
}) {
  const Tag = onClick ? "button" : "div"
  return (
    <Tag
      type={onClick ? "button" : undefined}
      title={title}
      onClick={onClick}
      style={style}
      className={cn("rounded border border-border bg-card box-border", className)}
    >
      {children}
    </Tag>
  )
}

function PanelListRow({
  label,
  trailing,
  depth = 0,
  onClick,
}: {
  label: string
  trailing?: string
  depth?: number
  onClick?: () => void
}) {
  const Tag = onClick ? "button" : "div"
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-1.5 px-2 py-1.5 text-left text-[11px]",
        onClick && "hover:bg-muted/40 transition-colors cursor-pointer",
      )}
      style={{ paddingLeft: `${8 + depth * 12}px` }}
    >
      <span className="flex-1 truncate">{label}</span>
      {trailing ? <span className="shrink-0 text-[10px] text-muted-foreground">{trailing}</span> : null}
    </Tag>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ManageMapsHome({ onOpenFloor }: { onOpenFloor: () => void }) {
  return (
    <div className="flex h-full flex-col gap-3 overflow-auto p-4">
      <div className="space-y-1">
        <div className="text-sm font-semibold">Manage Maps</div>
        <p className="text-xs text-muted-foreground">
          Org floorplan inventory — CDMX contractors land here to pick up assigned buildings.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button className={btnClass("primary")}>New building</button>
        <button className={btnClass("secondary")}>Import files</button>
        <button className={btnClass("secondary")}>Assign contractor</button>
      </div>
      <WireBox className="overflow-hidden p-0">
        <div className="grid grid-cols-5 gap-2 border-b border-border/50 px-3 py-2 text-[10px] uppercase text-muted-foreground">
          <span>Building</span>
          <span>Floor</span>
          <span>Status</span>
          <span>Contractor</span>
          <span>Devices</span>
        </div>
        {MANAGE_HOME_ROWS.map((row) => (
          <button
            key={`${row.building}-${row.floor}`}
            type="button"
            onClick={onOpenFloor}
            className="grid w-full grid-cols-5 gap-2 border-b border-border/30 px-3 py-2.5 text-left text-[11px] hover:bg-muted/30 transition-colors"
          >
            <span>{row.building}</span>
            <span>{row.floor}</span>
            <span>{row.status}</span>
            <span>{row.contractor}</span>
            <span>{row.devices}</span>
          </button>
        ))}
      </WireBox>
    </div>
  )
}

function EditorRightPanel({
  state,
  setState,
}: {
  state: AppState
  setState: (patch: Partial<AppState>) => void
}) {
  const selectedMarker = MARKERS.find((m) => m.id === state.selectedMarkerId) ?? null

  const selectTool = (tool: EditorTool) => {
    setState({
      editorTool: tool,
      editorRightTab: tool === "Select" ? "tools" : tool === "Camera" || tool === "Sensor" ? "devices" : "properties",
      stampActive: tool === "Camera" || tool === "Sensor",
      selectedMarkerId: tool === "Select" ? state.selectedMarkerId : null,
      showFovCones: tool === "Camera" && !!state.selectedMarkerId,
    })
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex border-b border-border/50">
        {(["tools", "devices", "properties"] as EditorRightTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setState({ editorRightTab: tab })}
            className={cn(
              "flex-1 px-2 py-2 text-[10px] capitalize transition-colors",
              state.editorRightTab === tab
                ? "bg-sky-500/10 text-sky-300 border-b-2 border-sky-500/50"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="flex-1 space-y-2.5 overflow-auto p-3">
        {state.editorRightTab === "tools" && (
          <>
            <button
              type="button"
              className={cn(btnClass(state.editorTool === "Select" ? "primary" : "secondary"), "w-full text-left")}
              onClick={() => selectTool("Select")}
            >
              Select
            </button>
            {EDITOR_TOOL_GROUPS.map((group) => (
              <div key={group.label} className="space-y-1.5">
                <div className="text-[10px] uppercase text-muted-foreground">{group.label}</div>
                {group.tools.map((tool) => (
                  <button
                    key={tool}
                    type="button"
                    className={cn(btnClass(state.editorTool === tool ? "primary" : "ghost"), "w-full text-left text-[11px]")}
                    onClick={() => selectTool(tool)}
                  >
                    {tool}
                  </button>
                ))}
              </div>
            ))}
          </>
        )}

        {state.editorRightTab === "devices" && (
          <>
            <p className="text-xs text-muted-foreground">Commissioned devices not yet placed on this floor.</p>
            {UNPLACED_DEVICES.map((d) => (
              <WireBox key={d.id} className="space-y-1 p-2">
                <div className="text-xs font-semibold">{d.label}</div>
                <div className="text-[10px] text-muted-foreground">{d.family} · {d.site}</div>
                <button
                  type="button"
                  className={cn(btnClass("secondary"), "mt-1.5")}
                  onClick={() => setState({ editorTool: "Camera", stampActive: true, editorRightTab: "devices" })}
                >
                  Place on map
                </button>
              </WireBox>
            ))}
          </>
        )}

        {state.editorRightTab === "properties" && (
          <>
            {selectedMarker ? (
              <>
                <div className="text-sm font-semibold">{selectedMarker.label}</div>
                <Chip label={selectedMarker.model} />
                {state.showFovCones && (
                  <>
                    <div className="text-[10px] uppercase text-muted-foreground">FOV</div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Bearing</span>
                      <span>127°</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Range</span>
                      <span>18 ft</span>
                    </div>
                    <button type="button" className={btnClass("secondary")}>Reset to model default</button>
                  </>
                )}
                <button type="button" className={btnClass("ghost")}>Delete marker</button>
              </>
            ) : (
              <>
                <div className="text-sm font-semibold">{state.editorTool} properties</div>
                {state.editorTool === "Wall" && (
                  <>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Snap to grid</span>
                      <span>On</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Thickness</span>
                      <span>6 in</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Click to add points. Double-click to finish segment.</p>
                  </>
                )}
                {state.editorTool === "Door" && (
                  <>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Width</span>
                      <span>36 in</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Swing</span>
                      <span>Left-in</span>
                    </div>
                  </>
                )}
                {state.editorTool === "Cable" && (
                  <p className="text-xs text-muted-foreground">
                    Draw path between device endpoints. Autosnap highlights valid targets within 2m.
                  </p>
                )}
                {state.editorTool === "Ruler" && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Last measure</span>
                    <span>24 ft 6 in</span>
                  </div>
                )}
                {state.editorTool === "Area" && (
                  <>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Name</span>
                      <span>Lobby</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Click vertices to define polygon. Esc to cancel.</p>
                  </>
                )}
                {state.editorTool === "Label" && (
                  <p className="text-xs text-muted-foreground">Click to place text annotation. Classify as room, entry, or exit.</p>
                )}
                {state.editorTool === "Select" && (
                  <p className="text-xs text-muted-foreground">Select a marker or structural element on the canvas to edit properties.</p>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function EditorCanvasOverlays({ state }: { state: AppState }) {
  if (!state.editorMode) return null

  return (
    <svg width="100%" height="100%" className="pointer-events-none absolute inset-0">
      {(state.editorTool === "Wall" || state.editorTool === "Door") && (
        <>
          <polyline points="28%,38% 42%,38% 42%,52% 58%,52%" fill="none" stroke="oklch(0.7 0.15 230)" strokeWidth="2" />
          {state.editorTool === "Door" && (
            <path d="M 42% 52% A 4% 4% 0 0 1 46% 48%" fill="none" stroke="oklch(0.65 0.02 230)" strokeWidth="1.5" />
          )}
        </>
      )}
      {state.editorTool === "Cable" && (
        <polyline
          points="55%,35% 62%,45% 58%,68% 70%,72%"
          fill="none"
          stroke="oklch(0.75 0.12 200)"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
      )}
      {state.editorTool === "Ruler" && (
        <>
          <line x1="30%" y1="60%" x2="48%" y2="60%" stroke="oklch(0.65 0.02 230)" strokeWidth="1.5" />
          <text x="39%" y="58%" fill="oklch(0.55 0.02 230)" fontSize="10">24 ft</text>
        </>
      )}
      {state.editorTool === "Area" && (
        <polygon
          points="48%,30% 68%,30% 72%,48% 52%,55%"
          fill="oklch(0.35 0.02 230 / 0.5)"
          stroke="oklch(0.7 0.15 230)"
          strokeWidth="1.5"
          opacity="0.5"
        />
      )}
      {state.showFovCones && state.selectedMarkerId === "cam-lobby-01" && (
        <polygon
          points="55%,35% 62%,28% 68%,42%"
          fill="oklch(0.7 0.15 230 / 0.15)"
          stroke="oklch(0.7 0.15 230)"
        />
      )}
      {state.stampActive && (
        <text x="50%" y="50%" fill="oklch(0.55 0.02 230)" fontSize="11" textAnchor="middle">
          Click to place {state.editorTool.toLowerCase()}
        </text>
      )}
    </svg>
  )
}

function LeftPanelContent({
  state,
  setState,
}: {
  state: AppState
  setState: (patch: Partial<AppState>) => void
}) {
  const selectedPlace = LOCATIONS.find((l) => l.id === state.selectedPlaceId) ?? null

  const goToPlace = useCallback(
    (loc: MockLocation) => {
      setState({
        selectedPlaceId: loc.id,
        placeTab: "overview",
        searchFocused: false,
        searchQuery: "",
        editorMode: false,
        editorEntry: "none",
        selectedMarkerId: null,
        rail: "map",
        filesFlyoutOpen: false,
      })
    },
    [setState],
  )

  if (state.searchFocused) {
    const q = state.searchQuery.toLowerCase()
    const matchedPlaces = q ? LOCATIONS.filter((l) => l.label.toLowerCase().includes(q)) : []
    const matchedDevices = q ? MARKERS.filter((m) => m.label.toLowerCase().includes(q)) : []
    return (
      <div className="h-full overflow-auto">
        {!q ? (
          <>
            <div className="px-3 py-2 text-[10px] uppercase text-muted-foreground">Recent</div>
            {LOCATIONS.slice(0, 2).map((loc) => (
              <PanelListRow key={loc.id} label={loc.label} onClick={() => goToPlace(loc)} />
            ))}
            <div className="my-1 border-t border-border/50" />
            <div className="px-3 py-2 text-[10px] uppercase text-muted-foreground">Places</div>
            {LOCATIONS.slice(2).map((loc) => (
              <PanelListRow key={loc.id} label={`${loc.label} · ${loc.kind}`} onClick={() => goToPlace(loc)} />
            ))}
            <div className="my-1 border-t border-border/50" />
            <div className="px-3 py-2 text-[10px] uppercase text-muted-foreground">Devices</div>
            {MARKERS.slice(0, 2).map((m) => (
              <PanelListRow key={m.id} label={`${m.label} · ${m.kind}`} />
            ))}
          </>
        ) : matchedPlaces.length === 0 && matchedDevices.length === 0 ? (
          <p className="p-3 text-xs text-muted-foreground">No results for &quot;{state.searchQuery}&quot;</p>
        ) : (
          <>
            {matchedPlaces.length > 0 && (
              <>
                <div className="px-3 py-2 text-[10px] uppercase text-muted-foreground">Places</div>
                {matchedPlaces.map((loc) => (
                  <PanelListRow key={loc.id} label={loc.label} onClick={() => goToPlace(loc)} />
                ))}
              </>
            )}
            {matchedDevices.length > 0 && (
              <>
                <div className="px-3 py-2 text-[10px] uppercase text-muted-foreground">Devices</div>
                {matchedDevices.map((m) => (
                  <PanelListRow key={m.id} label={m.label} trailing={m.kind} />
                ))}
              </>
            )}
          </>
        )}
      </div>
    )
  }

  if (state.editorMode && !state.searchFocused) {
    const place = selectedPlace ?? LOCATIONS.find((l) => l.id === "floor-3")!
    return (
      <div className="flex h-full flex-col gap-2 overflow-auto p-3">
        <div className="text-xs text-muted-foreground">Org › HQ Campus › Main Bldg › {place.label}</div>
        <div className="text-sm font-semibold">{place.label}</div>
        <Chip label="Editing" tone="accent" />
        <div className="border-t border-border/50" />
        <div className="text-[10px] uppercase text-muted-foreground">On this floor</div>
        {MARKERS.map((m) => (
          <PanelListRow
            key={m.id}
            label={m.label}
            trailing={m.kind}
            onClick={() =>
              setState({
                selectedMarkerId: m.id,
                editorTool: "Select",
                editorRightTab: "properties",
                showFovCones: m.kind === "Camera",
              })
            }
          />
        ))}
        <div className="border-t border-border/50" />
        <div className="text-[10px] uppercase text-muted-foreground">Unplaced ({UNPLACED_DEVICES.length})</div>
        {UNPLACED_DEVICES.slice(0, 2).map((d) => (
          <div key={d.id} className="text-xs text-muted-foreground">{d.label}</div>
        ))}
        <button type="button" className={btnClass("secondary")} onClick={() => setState({ editorRightTab: "devices" })}>
          Open device search
        </button>
      </div>
    )
  }

  if (selectedPlace) {
    const breadcrumb =
      selectedPlace.kind === "floor"
        ? "Org › HQ Campus › Main Bldg"
        : selectedPlace.kind === "building"
          ? "Org › HQ Campus"
          : "Org"
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <div className="shrink-0 space-y-2 border-b border-border/50 p-3">
          <button type="button" className={btnClass("ghost")} onClick={() => setState({ selectedPlaceId: null })}>
            {breadcrumb}
          </button>
          <div className="text-sm font-semibold">{selectedPlace.label}</div>
          <div className="flex flex-wrap gap-1.5">
            <Chip label={selectedPlace.kind} tone="accent" />
            <Chip label={selectedPlace.site} />
            <Chip
              label={`${selectedPlace.online}/${selectedPlace.total} online`}
              tone={selectedPlace.online === selectedPlace.total ? "success" : "warning"}
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              className={btnClass("primary")}
              onClick={() =>
                setState({
                  editorMode: true,
                  editorEntry: "in-context",
                  editorTool: "Select",
                  editorRightTab: "tools",
                  selectedMarkerId: null,
                })
              }
            >
              Open in Editor
            </button>
            {["Add to Collection", "Share", "Permissions", "Nearby"].map((a) => (
              <button key={a} type="button" className={btnClass("secondary")}>{a}</button>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 border-b border-border/50">
          {PLACE_TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setState({ placeTab: t })}
              className={cn(
                "px-3 py-2 text-[10px] capitalize transition-colors",
                state.placeTab === t
                  ? "text-foreground border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex-1 space-y-2 overflow-auto p-3 text-xs">
          {state.placeTab === "overview" && (
            <>
              <div className="text-[10px] uppercase text-muted-foreground">Marker counts</div>
              {[["Cameras", "24"], ["Doors", "12"], ["Sensors", "6"]].map(([l, n]) => (
                <div key={l} className="flex justify-between">
                  <span className="text-muted-foreground">{l}</span>
                  <span>{n}</span>
                </div>
              ))}
              <div className="border-t border-border/30 pt-2">
                <div className="text-[10px] uppercase text-muted-foreground">Linked files</div>
                <div className="text-muted-foreground">Floor-3-Layout-v2.pdf · Jan 14</div>
                {!state.filesFlyoutOpen && (
                  <div className="text-muted-foreground/70">Drag a floorplan onto the map, or open Files to upload.</div>
                )}
              </div>
            </>
          )}
          {state.placeTab === "markers" &&
            MARKERS.map((m) => (
              <PanelListRow
                key={m.id}
                label={m.label}
                trailing={m.kind}
                onClick={() => setState({ editorMode: true, editorTool: "Select", selectedMarkerId: m.id })}
              />
            ))}
          {state.placeTab === "activity" &&
            [
              "Motion detected · Cam-NE-01 · 2m ago",
              "Door propped · Door-007 · 14m ago",
              "Cam-SW-04 went offline · 1h ago",
              "Marker placed on Floor 3 · 3h ago",
            ].map((e) => (
              <div key={e} className="text-muted-foreground">{e}</div>
            ))}
          {state.placeTab === "about" &&
            [
              ["Site", selectedPlace.site],
              ["Kind", selectedPlace.kind],
              ["Parent", selectedPlace.kind === "floor" ? "Main Building" : "HQ Campus"],
              ["Online", `${selectedPlace.online} / ${selectedPlace.total}`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-muted-foreground">{k}</span>
                <span>{v}</span>
              </div>
            ))}
        </div>
      </div>
    )
  }

  if (state.rail === "locations") {
    return (
      <div className="overflow-auto p-2">
        <div className="px-2 py-1 text-[10px] uppercase text-muted-foreground">All Locations</div>
        {LOCATIONS.map((loc) => (
          <PanelListRow
            key={loc.id}
            label={loc.label}
            depth={loc.depth}
            trailing={`${loc.online}/${loc.total}`}
            onClick={() => goToPlace(loc)}
          />
        ))}
      </div>
    )
  }

  if (state.rail === "collections") {
    const filtered =
      state.collTab === "mine"
        ? COLLECTIONS.filter((c) => c.owned)
        : state.collTab === "shared"
          ? COLLECTIONS.filter((c) => c.shared)
          : []
    return (
      <div className="space-y-2 overflow-auto p-3">
        <div className="text-sm font-semibold">Collections</div>
        <div className="flex flex-wrap gap-1.5">
          {(["mine", "shared", "following"] as CollTab[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setState({ collTab: f })}
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-[10px] transition-colors",
                state.collTab === f
                  ? "bg-foreground text-background border-foreground"
                  : "border-border text-muted-foreground hover:border-foreground/40",
              )}
            >
              {f === "mine" ? "My Collections" : f === "shared" ? "Shared with me" : "Following"}
            </button>
          ))}
        </div>
        {filtered.map((col) => (
          <div key={col.id} className="space-y-1">
            <button
              type="button"
              className={btnClass("ghost", "w-full text-left")}
              onClick={() =>
                setState({
                  expandedCollectionId: state.expandedCollectionId === col.id ? null : col.id,
                })
              }
            >
              {col.label} ({col.count})
            </button>
            {state.expandedCollectionId === col.id &&
              Array.from({ length: Math.min(3, col.count) }, (_, i) => (
                <div key={i} className="pl-3 text-[10px] text-muted-foreground">
                  Camera {i + 1} · Online
                </div>
              ))}
          </div>
        ))}
      </div>
    )
  }

  if (state.rail === "layers") {
    return (
      <div className="space-y-3 overflow-auto p-3">
        <div className="text-sm font-semibold">Data Layers</div>
        {Object.entries(LAYER_GROUPS).map(([group, layers]) => (
          <div key={group} className="space-y-1">
            <div className="text-[10px] uppercase text-muted-foreground">{group}</div>
            {layers.map((layer) => {
              const active = state.activeLayers.includes(layer)
              return (
                <button
                  key={layer}
                  type="button"
                  className={cn(
                    btnClass(active ? "primary" : "ghost"),
                    "w-full justify-start text-left",
                  )}
                  onClick={() => {
                    const next = active
                      ? state.activeLayers.filter((l) => l !== layer)
                      : [...state.activeLayers, layer]
                    setState({ activeLayers: next })
                  }}
                >
                  {active ? "[x]" : "[ ]"} {layer}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    )
  }

  if (state.rail === "recents") {
    return (
      <div className="overflow-auto p-3">
        <div className="mb-2 text-sm font-semibold">Recently Viewed</div>
        {LOCATIONS.map((loc) => (
          <PanelListRow key={loc.id} label={loc.label} onClick={() => goToPlace(loc)} />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-2 overflow-auto p-3">
      <div className="text-[10px] uppercase text-muted-foreground">Active alerts</div>
      <Callout variant="warning" title="No active emergencies">
        Showing alerts scoped to HQ-MAIN.
      </Callout>
      {[
        "Door forced open · HQ › Floor 2 › Lobby · 3 min",
        "After-hours motion · Warehouse A › Dock 4 · 17 min",
      ].map((e) => (
        <div key={e} className="text-xs text-muted-foreground">{e}</div>
      ))}
      <div className="border-t border-border/50" />
      <div className="text-[10px] uppercase text-muted-foreground">Recents</div>
      {LOCATIONS.slice(0, 3).map((loc) => (
        <PanelListRow key={loc.id} label={loc.label} onClick={() => goToPlace(loc)} />
      ))}
    </div>
  )
}

function PrototypeFrame({
  state,
  setState,
  showDropHint,
}: {
  state: AppState
  setState: (patch: Partial<AppState>) => void
  showDropHint?: boolean
}) {
  const selectedPlace = LOCATIONS.find((l) => l.id === state.selectedPlaceId) ?? null

  const switchRail = (id: RailId) => {
    setState({
      rail: id,
      selectedPlaceId: null,
      editorMode: false,
      editorEntry: "none",
      selectedMarkerId: null,
      searchFocused: false,
      searchQuery: "",
      filesFlyoutOpen: false,
    })
  }

  const enterEditorFromManage = () => {
    setState({
      editorEntry: "in-context",
      editorMode: true,
      selectedPlaceId: "floor-3",
      editorTool: "Select",
      editorRightTab: "tools",
    })
  }

  if (state.editorEntry === "manage-home") {
    return (
      <WireBox className="relative h-[520px] overflow-hidden bg-muted/20">
        <WireBox className="absolute inset-x-0 top-0 flex h-9 items-center gap-3 rounded-none border-x-0 border-t-0 px-3">
          <span className="text-xs text-muted-foreground">Command</span>
          <span className="text-xs">Maps › Manage Maps</span>
        </WireBox>
        <div className="absolute inset-x-0 bottom-0 top-9">
          <ManageMapsHome onOpenFloor={enterEditorFromManage} />
        </div>
      </WireBox>
    )
  }

  const rightPanelWidth = state.editorMode ? 240 : 0

  return (
    <WireBox className="relative h-[520px] overflow-hidden bg-muted/20">
      {/* Command band */}
      <WireBox className="absolute inset-x-0 top-0 z-30 flex h-9 items-center gap-3 rounded-none border-x-0 border-t-0 px-3">
        <span className="text-xs text-muted-foreground">Command</span>
        <span className="text-xs">Maps</span>
        <span className="flex-1" />
        <span className="text-xs text-muted-foreground">Azalea Phangsoa</span>
      </WireBox>

      {/* Editor top bar */}
      {state.editorMode && (
        <WireBox
          className="absolute z-25 flex h-10 items-center gap-2 rounded-none border-x-0 border-t-0 px-3"
          style={{ top: 36, left: 40, right: rightPanelWidth }}
        >
          <button
            type="button"
            className={btnClass("ghost")}
            onClick={() =>
              setState({ editorMode: false, editorEntry: "none", selectedMarkerId: null, stampActive: false })
            }
          >
            Exit edit
          </button>
          <span className="text-xs font-semibold">{selectedPlace?.label ?? "Floor 3"} · Main Building</span>
          <span className="flex-1" />
          <button type="button" className={btnClass("ghost")} disabled={state.undoCount === 0}>
            Undo ({state.undoCount})
          </button>
          <button type="button" className={btnClass("ghost")} disabled={state.redoCount === 0}>
            Redo
          </button>
          <Chip label="Saved" tone="success" />
        </WireBox>
      )}

      {/* Tool strip */}
      {state.editorMode && (
        <WireBox className="absolute left-1/2 z-25 flex -translate-x-1/2 items-center gap-1 p-1" style={{ top: 82 }}>
          {EDITOR_TOOLS.map((t) => (
            <button
              key={t}
              type="button"
              className={cn(btnClass(state.editorTool === t ? "primary" : "ghost"), "text-[10px]")}
              onClick={() =>
                setState({
                  editorTool: t,
                  editorRightTab: t === "Select" ? "tools" : t === "Camera" || t === "Sensor" ? "devices" : "properties",
                  stampActive: t === "Camera" || t === "Sensor",
                  selectedMarkerId: t === "Select" ? state.selectedMarkerId : null,
                })
              }
            >
              {t}
            </button>
          ))}
        </WireBox>
      )}

      {/* Map canvas */}
      <div
        className="absolute bottom-0 left-0 bg-muted/40"
        style={{
          top: state.editorMode ? 76 : 36,
          right: rightPanelWidth,
        }}
        onClick={() => {
          if (state.searchFocused) setState({ searchFocused: false, searchQuery: "" })
        }}
      >
        <svg width="100%" height="100%" className="absolute inset-0 opacity-35">
          <defs>
            <pattern id="editor-grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="oklch(0.35 0.02 230)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#editor-grid)" />
          <rect x="18%" y="22%" width="52%" height="48%" fill="none" stroke="oklch(0.45 0.02 230)" strokeWidth="1.5" />
          <rect x="28%" y="32%" width="18%" height="14%" fill="none" stroke="oklch(0.45 0.02 230)" strokeWidth="1" />
          <rect x="52%" y="38%" width="12%" height="20%" fill="none" stroke="oklch(0.45 0.02 230)" strokeWidth="1" />
        </svg>

        <EditorCanvasOverlays state={state} />

        {showDropHint && (
          <WireBox className="absolute inset-3 z-15 flex items-center justify-center border-dashed bg-muted/30">
            <div className="space-y-1.5 text-center">
              <div className="text-sm font-semibold">Drop floorplan to attach + align</div>
              <div className="text-xs text-muted-foreground">Path B: one drop replaces 3-step wizard when Place is selected</div>
            </div>
          </WireBox>
        )}

        {MARKERS.map((marker) => {
          const selected = state.selectedMarkerId === marker.id
          return (
            <button
              key={marker.id}
              type="button"
              title={marker.label}
              onClick={(e) => {
                e.stopPropagation()
                if (state.editorMode)
                  setState({
                    selectedMarkerId: marker.id,
                    editorTool: "Select",
                    editorRightTab: "properties",
                    showFovCones: marker.kind === "Camera",
                    stampActive: false,
                  })
              }}
              className={cn(
                "absolute rounded-full border-2 -translate-x-1/2 -translate-y-1/2 p-0 transition-all",
                state.editorMode ? "size-2.5 cursor-pointer" : "size-1.5 cursor-default",
                selected ? "border-sky-400" : "border-border",
                marker.status === "Online" ? "bg-emerald-400/85" : "bg-red-400/85",
              )}
              style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
            />
          )
        })}

        <div className="absolute right-[180px] top-3 font-mono text-[10px] text-muted-foreground/50">
          {selectedPlace?.kind === "floor" ? `${selectedPlace.label} · Main Bldg` : "Floor 3 · Main Bldg"}
        </div>

        {!state.editorMode && (
          <WireBox className="absolute right-3 top-3 z-20 w-40 overflow-hidden p-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setState({ sitePickerOpen: !state.sitePickerOpen })
              }}
              className="flex w-full cursor-pointer items-center justify-between border-none bg-transparent px-2.5 py-2 text-[11px]"
            >
              <span>Sites: HQ-MAIN</span>
              <span className="text-muted-foreground">12 places</span>
            </button>
            {state.sitePickerOpen && (
              <div className="border-t border-border/50">
                {["HQ-MAIN", "EC-01", "WH-01"].map((site) => (
                  <PanelListRow key={site} label={site} trailing={site === "HQ-MAIN" ? "active" : undefined} />
                ))}
              </div>
            )}
            <div className="border-t border-border/50 p-2.5">
              <div className="flex items-center justify-between text-xs">
                <span>Alerts & Events</span>
                <Chip label="2" tone="warning" />
              </div>
              <div className="mt-1.5 space-y-1">
                <div className="text-xs text-muted-foreground">Door forced open · Lobby</div>
                <div className="text-xs text-muted-foreground">After-hours motion · Dock 4</div>
              </div>
            </div>
          </WireBox>
        )}

        <div className="absolute bottom-3 right-3 flex flex-col gap-1">
          {["+", "−"].map((z) => (
            <WireBox key={z} className="grid size-7 place-items-center text-sm">{z}</WireBox>
          ))}
        </div>

        <button
          type="button"
          className={cn(btnClass("secondary"), "absolute bottom-3 left-3 text-[10px]")}
          onClick={(e) => {
            e.stopPropagation()
            setState({ layersClusterOpen: !state.layersClusterOpen })
          }}
        >
          Layers · {state.activeLayers.length} on
        </button>

        {state.layersClusterOpen && (
          <WireBox className="absolute bottom-12 left-3 z-20 w-[220px] p-2.5">
            <div className="text-[11px] font-semibold">Layers</div>
            <div className="text-xs text-muted-foreground">31 devices · None selected</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <div className="text-[10px] text-muted-foreground">Devices</div>
                {["Cameras", "Doors", "Sensors"].map((d) => (
                  <div key={d} className="text-xs">[x] {d}</div>
                ))}
              </div>
              <div className="space-y-1">
                <div className="text-[10px] text-muted-foreground">Data overlay</div>
                {["Status", "Coverage", "Events"].map((d, i) => (
                  <div key={d} className="text-xs">{i === 0 ? "(o)" : "( )"} {d}</div>
                ))}
              </div>
            </div>
            <div className="mt-2 flex gap-2">
              <span className="rounded-full border border-border px-2 py-0.5 text-[10px]">Satellite</span>
              <span className="rounded-full border border-border px-2 py-0.5 text-[10px]">Dark</span>
            </div>
          </WireBox>
        )}

        {state.activeLayers.length > 0 && !state.layersClusterOpen && (
          <div className="absolute bottom-12 right-3 flex flex-col items-end gap-1">
            {state.activeLayers.slice(0, 3).map((l) => (
              <Chip key={l} label={l} />
            ))}
          </div>
        )}
      </div>

      {/* Left rail */}
      <WireBox className="absolute bottom-0 left-0 top-9 z-20 flex w-10 flex-col items-center gap-1.5 rounded-none border-b-0 border-l-0 border-t-0 pt-2">
        <button type="button" className={btnClass("ghost", "px-1 py-0.5 text-[10px]")} onClick={() => setState({ filesFlyoutOpen: !state.filesFlyoutOpen })}>
          Menu
        </button>
        {RAIL_ITEMS.map((item) => {
          const active =
            state.rail === item.id &&
            !state.selectedPlaceId &&
            !state.editorMode &&
            !state.searchFocused
          return (
            <button
              key={item.id}
              type="button"
              title={item.label}
              onClick={() => switchRail(item.id)}
              className={cn(
                "size-7 cursor-pointer rounded border text-[10px] transition-colors",
                active ? "border-border bg-muted/60" : "border-border/40 bg-transparent hover:bg-muted/40",
              )}
            >
              {item.abbr}
            </button>
          )
        })}
      </WireBox>

      {/* Left panel */}
      <WireBox
        className="absolute bottom-0 z-20 flex w-[220px] flex-col overflow-hidden rounded-none border-b-0 border-t-0 p-0"
        style={{ top: state.editorMode ? 76 : 36, left: 40 }}
      >
        <div className="border-b border-border/50 p-2">
          {!state.editorMode && state.searchFocused ? (
            <div className="flex items-center gap-1.5">
              <input
                value={state.searchQuery}
                onChange={(e) => setState({ searchQuery: e.target.value })}
                placeholder="Search Verkada Maps…"
                className="min-w-0 flex-1 rounded border border-border bg-muted/50 px-2 py-1.5 text-[11px] outline-none"
              />
              <button type="button" className={btnClass("ghost")} onClick={() => setState({ searchFocused: false, searchQuery: "" })}>
                x
              </button>
            </div>
          ) : !state.editorMode ? (
            <button
              type="button"
              className={cn(btnClass("secondary"), "w-full justify-start text-left text-[11px]")}
              onClick={() => setState({ searchFocused: true })}
            >
              Search Verkada Maps…
            </button>
          ) : (
            <div className="py-1 text-xs text-muted-foreground">Floor context</div>
          )}
        </div>
        <div className="min-h-0 flex-1">
          <LeftPanelContent state={state} setState={setState} />
        </div>
      </WireBox>

      {/* Editor right panel */}
      {state.editorMode && (
        <WireBox
          className="absolute bottom-0 right-0 z-20 overflow-hidden rounded-none border-b-0 border-r-0 border-t-0 p-0"
          style={{ top: 36, width: rightPanelWidth }}
        >
          <EditorRightPanel state={state} setState={setState} />
        </WireBox>
      )}

      {/* Files flyout */}
      {state.filesFlyoutOpen && (
        <WireBox className="absolute left-12 top-[72px] z-40 w-[200px] p-2.5">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-semibold">Files</div>
            <button type="button" className={btnClass("ghost")} onClick={() => setState({ filesFlyoutOpen: false })}>
              x
            </button>
          </div>
          <WireBox className="mt-2 border-dashed bg-muted/30 p-4 text-center">
            <div className="text-xs text-muted-foreground">Drop files here</div>
            <button type="button" className={cn(btnClass("primary"), "mt-2")}>Upload</button>
          </WireBox>
          <div className="mt-2.5 space-y-1.5">
            <div className="text-[10px] uppercase text-muted-foreground">Unplaced</div>
            <div className="flex items-center justify-between">
              <span className="text-xs">Floor-4-draft.pdf</span>
              <button type="button" className={btnClass("secondary")}>Bind to Place</button>
            </div>
          </div>
        </WireBox>
      )}
    </WireBox>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function EditorPrototype() {
  const [state, setStateRaw] = useLocalStorageState<AppState>("maps2-editor-mock", EDITOR_DEFAULT)
  const [activePreset, setActivePreset] = useLocalStorageState<string>("maps2-editor-preset", "editor-idle")
  const [workspaceFocus, setWorkspaceFocus] = useLocalStorageState<WorkspaceFocus>("maps2-workspace-focus", "editor")

  const setState = useCallback(
    (patch: Partial<AppState>) => setStateRaw((prev) => mergeAppState(prev, patch)),
    [setStateRaw],
  )

  const jumpToPreset = useCallback(
    (id: string) => {
      const preset = PRESET_STATES.find((p) => p.id === id)
      if (!preset) return
      setActivePreset(id)
      const base = EDITOR_PRESETS.some((p) => p.id === id) ? EDITOR_DEFAULT : DEFAULT_STATE
      setStateRaw(mergeAppState(base, preset.state))
    },
    [setActivePreset, setStateRaw],
  )

  const currentPreset = PRESET_STATES.find((p) => p.id === activePreset) ?? EDITOR_PRESETS[2]
  const showDropHint = activePreset === "editor-drop"
  const visiblePresets = workspaceFocus === "editor" ? EDITOR_PRESETS : PRESET_STATES

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setWorkspaceFocus("editor")}
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-[10px] transition-colors",
              workspaceFocus === "editor"
                ? "bg-foreground text-background border-foreground"
                : "border-border text-muted-foreground hover:border-foreground/40",
            )}
          >
            Editor focus
          </button>
          <button
            type="button"
            onClick={() => setWorkspaceFocus("full")}
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-[10px] transition-colors",
              workspaceFocus === "full"
                ? "bg-foreground text-background border-foreground"
                : "border-border text-muted-foreground hover:border-foreground/40",
            )}
          >
            Full IA
          </button>
          <span className="rounded-full border border-border px-2.5 py-0.5 text-[10px] text-muted-foreground">
            {EDITOR_PRESETS.length} editor states
          </span>
          <span className="rounded-full border border-border px-2.5 py-0.5 text-[10px] text-muted-foreground">
            PRD M2 MVP
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[220px_1fr]">
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">{workspaceFocus === "editor" ? "Editor states" : "All states"}</h3>
          <div className="space-y-1">
            {visiblePresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                title={preset.description}
                onClick={() => jumpToPreset(preset.id)}
                className={cn(
                  btnClass(activePreset === preset.id ? "primary" : "ghost"),
                  "w-full text-left",
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>State:</span>
            <span className="font-semibold text-foreground">{stateLabel(state)}</span>
            <button type="button" className={btnClass("ghost")} onClick={() => jumpToPreset("editor-idle")}>
              Reset editor
            </button>
          </div>

          <PrototypeFrame state={state} setState={setState} showDropHint={showDropHint} />

          <Callout variant="info" title={currentPreset.label}>
            {currentPreset.description}
          </Callout>
        </div>
      </div>

      <div className="space-y-4 border-t border-border/50 pt-6">
        <div>
          <h2 className="text-lg font-semibold">Editor layout</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Hybrid entry: Manage Maps admin home (state 1) or in-context from Place card (state 2). Edit mode keeps
            the same map chrome but adds a top bar (exit, undo/redo), center tool strip, left floor context, and right
            panel (tools / devices / properties).
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <div className="text-sm font-semibold">Left panel</div>
            <p className="text-xs text-muted-foreground">Floor breadcrumb, placed devices, unplaced device shortcuts</p>
          </div>
          <div className="space-y-1">
            <div className="text-sm font-semibold">Canvas</div>
            <p className="text-xs text-muted-foreground">Tool overlays: walls, FOV cones, cables, rulers, areas, stamp cursor</p>
          </div>
          <div className="space-y-1">
            <div className="text-sm font-semibold">Right panel (340px target)</div>
            <p className="text-xs text-muted-foreground">Tools grouped by Structural / Devices / Paths / Space — swaps to properties per selection</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">PRD P0 editor scope</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {[
            "Draw walls, doors, windows",
            "Place & reposition device tokens",
            "Adjust FOV cone per camera",
            "Draw cable paths with autosnap",
            "Rulers / measurement lines",
            "Create & reshape areas/zones",
            "Place labels (room, entry, exit)",
            "Scale & align floorplan to walls",
            "Undo/redo within session",
          ].map((item) => (
            <p key={item} className="text-xs text-muted-foreground">· {item}</p>
          ))}
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground/70">
        Source: Maps v1 PRD · IA draft §6 · Site Planner editor · nav audit mock · May 2026 · Azalea Phangsoa
      </p>
    </div>
  )
}
