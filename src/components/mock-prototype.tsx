import { useState } from "react"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Callout } from "@/components/callout"

// ─── Data ─────────────────────────────────────────────────────────────────────

const LOCATIONS = [
  { id: "hq", label: "HQ Campus", kind: "location" as const, site: "HQ-MAIN", online: 143, total: 156, depth: 0 },
  { id: "main-bldg", label: "Main Building", kind: "building" as const, site: "HQ-MAIN", online: 80, total: 87, depth: 1 },
  { id: "floor-3", label: "Floor 3", kind: "floor" as const, site: "HQ-MAIN", online: 42, total: 45, depth: 2 },
  { id: "east-campus", label: "East Campus", kind: "location" as const, site: "EC-01", online: 65, total: 69, depth: 0 },
  { id: "warehouse-a", label: "WAREHOUSE-A", kind: "location" as const, site: "WH-01", online: 23, total: 23, depth: 0 },
]

const MARKERS = [
  { id: "cam-lobby-01", label: "Cam-Lobby-01", kind: "Camera" as const, model: "CD52", status: "Online" as const, x: 55, y: 35 },
  { id: "cam-ne-01",    label: "Cam-NE-01",    kind: "Camera" as const, model: "CD31", status: "Online" as const, x: 65, y: 55 },
  { id: "cam-sw-04",    label: "Cam-SW-04",    kind: "Camera" as const, model: "CD52", status: "Offline" as const, x: 75, y: 42 },
  { id: "door-007",     label: "Door-007",     kind: "Access Control" as const, model: "AC42", status: "Online" as const, x: 58, y: 68 },
  { id: "cam-nw-02",   label: "Cam-NW-02",   kind: "Camera" as const, model: "CD31", status: "Online" as const, x: 70, y: 72 },
]

const COLLECTIONS = [
  { id: "hq-ext",    label: "HQ External Cameras",  count: 12, owned: true },
  { id: "door-audit", label: "Door Access Audit",    count: 8,  owned: true },
  { id: "parking-a", label: "Parking Zone A",        count: 4,  owned: false, shared: true },
]

const LAYER_GROUPS = {
  "(A) Devices & Entities":  ["Cameras", "Access Control", "Alarms", "Sensors"],
  "(B) Visualizations": ["Device Status", "Coverage", "Events & Alerts", "Foot Traffic"],
}

// ─── Types ────────────────────────────────────────────────────────────────────

type RailId = "map" | "locations" | "collections" | "layers" | "recents"
type PlaceTab = "overview" | "markers" | "activity" | "about"
type EditorTool = "Select" | "Wall" | "Door" | "Camera" | "Sensor" | "Label"
type MockLocation = typeof LOCATIONS[0]
type MockMarker = typeof MARKERS[0]
type CollTab = "mine" | "shared" | "following"

const RAIL_ITEMS: { id: RailId; icon: string; label: string }[] = [
  { id: "map",         icon: "🗺",  label: "Map"         },
  { id: "locations",   icon: "📍",  label: "Locations"   },
  { id: "collections", icon: "📁",  label: "Collections" },
  { id: "layers",      icon: "⚡",  label: "Layers"      },
  { id: "recents",     icon: "🕐",  label: "Recents"     },
]

const PLACE_TABS: PlaceTab[] = ["overview", "markers", "activity", "about"]
const EDITOR_TOOLS: EditorTool[] = ["Select", "Wall", "Door", "Camera", "Sensor", "Label"]

// ─── Status badge helper ──────────────────────────────────────────────────────

function StatusChip({ label, variant }: { label: string; variant: "sky" | "violet" | "emerald" | "amber" | "red" | "neutral" }) {
  const cls = {
    sky:     "border-sky-500/30 bg-sky-500/10 text-sky-300",
    violet:  "border-violet-500/30 bg-violet-500/10 text-violet-300",
    emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    amber:   "border-amber-500/30 bg-amber-500/10 text-amber-300",
    red:     "border-red-500/30 bg-red-500/10 text-red-300",
    neutral: "border-border bg-muted/50 text-muted-foreground",
  }[variant]
  return <span className={cn("rounded border px-1.5 py-px text-[10px] font-medium", cls)}>{label}</span>
}

// ─── Panel sections ───────────────────────────────────────────────────────────

function NullPanel({ onClickRecent }: { onClickRecent: (loc: MockLocation) => void }) {
  return (
    <div className="p-3 space-y-3 text-xs overflow-auto h-full">
      <div className="font-medium text-muted-foreground text-[11px] uppercase tracking-wider">Active alerts</div>
      <div className="rounded border border-amber-500/30 bg-amber-500/10 text-amber-300 p-2 text-[11px]">No active emergencies</div>
      {["Cam-NE-01 · Motion · 2m ago", "Door-007 · Propped · 14m ago", "Cam-SW-04 · Offline · 1h ago"].map(e => (
        <div key={e} className="text-muted-foreground py-1 border-b border-border/30 text-[11px]">{e}</div>
      ))}
      <div className="font-medium text-muted-foreground text-[11px] uppercase tracking-wider pt-1">Recents</div>
      {LOCATIONS.slice(0, 3).map(loc => (
        <button
          key={loc.id}
          className="w-full flex justify-between py-1.5 border-b border-border/30 text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => onClickRecent(loc)}
        >
          <span>{loc.label}</span>
          <ChevronRight className="size-3 mt-0.5" />
        </button>
      ))}
    </div>
  )
}

function LocationsPanel({ onSelect }: { onSelect: (loc: MockLocation) => void }) {
  return (
    <div className="p-2 overflow-auto h-full">
      <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider px-2 py-1">All Locations</div>
      {LOCATIONS.map(loc => (
        <button
          key={loc.id}
          className="w-full flex items-center gap-1 px-2 py-1.5 rounded hover:bg-muted/40 text-left text-xs"
          style={{ paddingLeft: `${(loc.depth * 12) + 8}px` }}
          onClick={() => onSelect(loc)}
        >
          {loc.depth > 0 && <span className="text-muted-foreground/30 mr-0.5 shrink-0">{"›"}</span>}
          <span className="flex-1 truncate">{loc.label}</span>
          <span className={cn("text-[10px] shrink-0", loc.online === loc.total ? "text-emerald-400" : "text-amber-400")}>
            {loc.online}/{loc.total}
          </span>
        </button>
      ))}
    </div>
  )
}

function CollectionsPanel({
  collTab, onCollTabChange,
  expandedId, onExpandToggle,
}: {
  collTab: CollTab
  onCollTabChange: (t: CollTab) => void
  expandedId: string | null
  onExpandToggle: (id: string) => void
}) {
  const filtered = collTab === "mine"
    ? COLLECTIONS.filter(c => c.owned)
    : collTab === "shared"
    ? COLLECTIONS.filter(c => c.shared)
    : []

  return (
    <div className="p-3 text-xs overflow-auto h-full space-y-2">
      <div className="font-semibold text-sm">Collections</div>
      <div className="flex gap-1.5 flex-wrap">
        {(["mine", "shared", "following"] as CollTab[]).map(f => (
          <button
            key={f}
            onClick={() => onCollTabChange(f)}
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-[10px] transition-colors",
              f === collTab
                ? "bg-foreground text-background border-foreground"
                : "border-border text-muted-foreground hover:border-foreground/40",
            )}
          >
            {f === "mine" ? "My Collections" : f === "shared" ? "Shared with me" : "Following"}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-muted-foreground/50 text-[10px] py-4 text-center">Nothing here yet.</div>
      ) : filtered.map(col => (
        <div key={col.id}>
          <button
            className="w-full flex items-center justify-between py-1.5 px-1 hover:bg-muted/20 rounded transition-colors"
            onClick={() => onExpandToggle(col.id)}
          >
            <span>{col.label} ({col.count})</span>
            <ChevronRight className={cn("size-3 text-muted-foreground transition-transform duration-150", expandedId === col.id && "rotate-90")} />
          </button>
          {expandedId === col.id && (
            <div className="pl-3 space-y-0.5 pb-1">
              {Array.from({ length: Math.min(3, col.count) }, (_, i) => (
                <div key={i} className="text-[10px] text-muted-foreground py-0.5 border-b border-border/20 last:border-0 flex justify-between">
                  <span>Camera {i + 1}</span>
                  <span className="text-emerald-400/70">Online</span>
                </div>
              ))}
              {col.count > 3 && (
                <div className="text-[10px] text-muted-foreground/50">+{col.count - 3} more</div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function LayersPanel({
  activeLayers,
  onToggle,
}: {
  activeLayers: Set<string>
  onToggle: (layer: string) => void
}) {
  return (
    <div className="p-3 space-y-3 text-xs overflow-auto h-full">
      <div className="font-semibold text-sm">Data Layers</div>
      {Object.entries(LAYER_GROUPS).map(([groupLabel, layers]) => (
        <div key={groupLabel}>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1.5">{groupLabel}</div>
          {layers.map(layer => {
            const active = activeLayers.has(layer)
            const isViz = groupLabel.includes("Viz")
            return (
              <button
                key={layer}
                className="flex items-center gap-2 py-1 w-full hover:bg-muted/20 rounded px-1 transition-colors"
                onClick={() => onToggle(layer)}
              >
                <div className={cn(
                  "size-3 border-2 transition-colors shrink-0",
                  isViz ? "rounded-full" : "rounded-sm",
                  active
                    ? (isViz ? "border-sky-400 bg-sky-400/30" : "border-emerald-400 bg-emerald-400/30")
                    : "border-border bg-transparent",
                )} />
                <span className={cn("text-[11px]", !active && "text-muted-foreground")}>{layer}</span>
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}

function RecentsPanel({ onSelect }: { onSelect: (loc: MockLocation) => void }) {
  return (
    <div className="p-3 text-xs overflow-auto h-full">
      <div className="font-semibold text-sm mb-2">Recently Viewed</div>
      {LOCATIONS.map(loc => (
        <button
          key={loc.id}
          className="w-full flex items-center justify-between py-1.5 border-b border-border/30 hover:bg-muted/20 rounded px-1 transition-colors text-left"
          onClick={() => onSelect(loc)}
        >
          <span className="text-xs">{loc.label}</span>
          <ChevronRight className="size-3 text-muted-foreground" />
        </button>
      ))}
    </div>
  )
}

function SearchPanel({
  query,
  onSelectPlace,
}: {
  query: string
  onSelectPlace: (loc: MockLocation) => void
}) {
  const lcq = query.toLowerCase()
  const matchedPlaces = query ? LOCATIONS.filter(l => l.label.toLowerCase().includes(lcq)) : []
  const matchedDevices = query ? MARKERS.filter(m => m.label.toLowerCase().includes(lcq)) : []

  if (query && matchedPlaces.length === 0 && matchedDevices.length === 0) {
    return <div className="p-4 text-xs text-muted-foreground">No results for "{query}"</div>
  }

  if (query) {
    return (
      <div className="overflow-auto">
        {matchedPlaces.length > 0 && (
          <>
            <div className="px-3 py-1 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider bg-muted/30">Places</div>
            {matchedPlaces.map(loc => (
              <button key={loc.id} className="w-full px-3 py-2 hover:bg-muted/40 text-sm text-left flex items-center gap-2" onClick={() => onSelectPlace(loc)}>
                <span className="text-muted-foreground/40">📍</span>{loc.label}
              </button>
            ))}
          </>
        )}
        {matchedDevices.length > 0 && (
          <>
            <div className="px-3 py-1 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider bg-muted/30">Devices</div>
            {matchedDevices.map(m => (
              <button key={m.id} className="w-full px-3 py-2 hover:bg-muted/40 text-sm text-left flex items-center gap-2">
                <span className="text-muted-foreground/40">📷</span>
                <span className="flex-1">{m.label}</span>
                <span className="text-[10px] text-muted-foreground/50">{m.kind}</span>
              </button>
            ))}
          </>
        )}
      </div>
    )
  }

  // Empty query: show grouped suggestions
  const groups = [
    { type: "Recent", items: [{ id: "hq", label: "HQ Campus" }, { id: "floor-3", label: "Floor 3 · Main Bldg" }] },
    { type: "Places", items: [{ id: "east-campus", label: "East Campus · Location" }, { id: "warehouse-a", label: "WAREHOUSE-A · Location" }] },
    { type: "Devices", items: [{ id: "_cam", label: "Cam-Lobby-01 · Camera" }, { id: "_door", label: "Door-007 · Access Control" }] },
  ]

  return (
    <div className="overflow-auto">
      {groups.map(group => (
        <div key={group.type}>
          <div className="px-3 py-1 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider bg-muted/30">{group.type}</div>
          {group.items.map(item => {
            const loc = LOCATIONS.find(l => l.id === item.id)
            return (
              <button
                key={item.id}
                className="w-full px-3 py-2 hover:bg-muted/40 text-sm text-left"
                onClick={() => loc && onSelectPlace(loc)}
              >
                {item.label}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}

function PlacePanel({
  place,
  placeTab,
  onTabChange,
  onBack,
  onOpenEditor,
  onSelectMarker,
}: {
  place: MockLocation
  placeTab: PlaceTab
  onTabChange: (t: PlaceTab) => void
  onBack: () => void
  onOpenEditor: () => void
  onSelectMarker: (m: MockMarker) => void
}) {
  const breadcrumb =
    place.kind === "floor"    ? "Org › HQ Campus › Main Bldg"
    : place.kind === "building" ? "Org › HQ Campus"
    : "Org"

  const onlineOk = place.online === place.total

  return (
    <div className="h-full flex flex-col text-sm overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-border/50 shrink-0">
        <button
          className="text-[10px] text-muted-foreground hover:text-foreground transition-colors mb-1 flex items-center gap-1"
          onClick={onBack}
        >
          ← {breadcrumb}
        </button>
        <div className="font-semibold">{place.label}</div>
        <div className="flex gap-1 mt-1.5 flex-wrap">
          <StatusChip label={place.kind} variant="sky" />
          <StatusChip label={place.site} variant="violet" />
          <StatusChip label={`${place.online}/${place.total} online`} variant={onlineOk ? "emerald" : "amber"} />
        </div>
        <div className="flex gap-1.5 mt-2.5 flex-wrap">
          {[
            { label: "Open in Editor", primary: true, action: onOpenEditor },
            { label: "Add to Collection", primary: false, action: () => {} },
            { label: "Share",            primary: false, action: () => {} },
            { label: "Permissions",      primary: false, action: () => {} },
            { label: "Nearby",           primary: false, action: () => {} },
          ].map(a => (
            <button
              key={a.label}
              onClick={a.action}
              className={cn(
                "rounded border px-2 py-0.5 text-[10px] transition-colors",
                a.primary
                  ? "border-sky-500/30 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20"
                  : "border-border bg-muted/50 hover:border-foreground/40",
              )}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex border-b border-border/50 shrink-0">
        {PLACE_TABS.map(t => (
          <button
            key={t}
            className={cn(
              "px-3 py-2 text-[10px] font-medium transition-colors capitalize",
              t === placeTab
                ? "text-foreground border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => onTabChange(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab body */}
      <div className="p-3 flex-1 overflow-auto space-y-2 text-xs">
        {placeTab === "overview" && (
          <>
            <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Marker counts</div>
            {[{ l: "Cameras", n: 24 }, { l: "Doors", n: 12 }, { l: "Sensors", n: 6 }].map(m => (
              <div key={m.l} className="flex justify-between"><span className="text-muted-foreground">{m.l}</span><span>{m.n}</span></div>
            ))}
            <div className="border-t border-border/30 pt-2 space-y-1">
              <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Linked files</div>
              <div className="text-muted-foreground">Floor-3-Layout-v2.pdf · Jan 14</div>
            </div>
          </>
        )}
        {placeTab === "markers" && (
          <div className="space-y-px">
            {MARKERS.map(m => (
              <button
                key={m.id}
                className="w-full flex items-center gap-2 py-1.5 border-b border-border/30 last:border-0 hover:bg-muted/20 rounded px-1 text-left"
                onClick={() => { onOpenEditor(); onSelectMarker(m) }}
              >
                <span className={cn("size-2 rounded-full shrink-0", m.status === "Online" ? "bg-emerald-400" : "bg-red-400")} />
                <span className="flex-1 text-[11px]">{m.label}</span>
                <span className="text-[10px] text-muted-foreground/60">{m.kind}</span>
              </button>
            ))}
          </div>
        )}
        {placeTab === "activity" && (
          <>
            {["Motion detected · Cam-NE-01 · 2m ago", "Door propped · Door-007 · 14m ago", "Cam-SW-04 went offline · 1h ago", "Marker placed on Floor 3 · 3h ago"].map(e => (
              <div key={e} className="text-[10px] text-muted-foreground py-1.5 border-b border-border/30 last:border-0">{e}</div>
            ))}
          </>
        )}
        {placeTab === "about" && (
          <>
            {[
              ["Site", place.site],
              ["Kind", place.kind],
              ["Parent", place.kind === "floor" ? "Main Building" : place.kind === "building" ? "HQ Campus" : "Root"],
              ["Online", `${place.online} / ${place.total}`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-muted-foreground capitalize">{k}</span>
                <span className="capitalize">{v}</span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

function MarkerDetailPanel({
  marker,
  onBack,
}: {
  marker: MockMarker
  onBack: () => void
}) {
  return (
    <div className="p-3 space-y-2 text-xs overflow-auto h-full">
      <button
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-[10px] transition-colors"
        onClick={onBack}
      >
        ← back to floor
      </button>
      <div className="font-semibold text-sm pt-1">{marker.label}</div>
      <div className="flex gap-1.5 flex-wrap">
        <StatusChip label={marker.kind} variant="sky" />
        <StatusChip label={marker.status} variant={marker.status === "Online" ? "emerald" : "red"} />
        <StatusChip label={marker.model} variant="neutral" />
      </div>
      <div className="flex gap-1.5 flex-wrap pt-1">
        {["Open footage", "Live view", "Configure"].map(a => (
          <button key={a} className="rounded border border-border bg-muted/50 px-2 py-0.5 text-[10px] hover:border-foreground/30 transition-colors">{a}</button>
        ))}
      </div>
      <div className="border-t border-border/40 pt-2 space-y-1">
        {[
          ["Name",   marker.label],
          ["Kind",   marker.kind],
          ["Model",  marker.model],
          ["Status", marker.status],
          ["Site",   "HQ-MAIN"],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between">
            <span className="text-muted-foreground">{k}</span>
            <span className={v === "Offline" ? "text-red-400" : v === "Online" ? "text-emerald-400" : ""}>{v}</span>
          </div>
        ))}
      </div>
      <button className="mt-3 w-full text-center text-[10px] text-red-400 hover:text-red-300 py-1 border border-red-500/20 hover:border-red-500/40 rounded transition-colors">
        Remove marker
      </button>
    </div>
  )
}

// ─── Main prototype ───────────────────────────────────────────────────────────

export function MockPrototype() {
  // Navigation state
  const [rail, setRail] = useState<RailId>("map")
  const [searchFocused, setSearchFocused] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPlace, setSelectedPlace] = useState<MockLocation | null>(null)
  const [placeTab, setPlaceTab] = useState<PlaceTab>("overview")
  const [editorMode, setEditorMode] = useState(false)
  const [editorTool, setEditorTool] = useState<EditorTool>("Select")
  const [selectedMarker, setSelectedMarker] = useState<MockMarker | null>(null)
  const [activeLayers, setActiveLayers] = useState<Set<string>>(new Set(["Device Status", "Coverage"]))
  const [expandedCollection, setExpandedCollection] = useState<string | null>(null)
  const [collTab, setCollTab] = useState<CollTab>("mine")

  // ── Transitions ──

  function goToPlace(loc: MockLocation) {
    setSelectedPlace(loc)
    setPlaceTab("overview")
    setSearchFocused(false)
    setSearchQuery("")
    setEditorMode(false)
    setSelectedMarker(null)
    setRail("map")
  }

  function openEditor() {
    setEditorMode(true)
    setEditorTool("Select")
    setSelectedMarker(null)
  }

  function exitEditor() {
    setEditorMode(false)
    setSelectedMarker(null)
  }

  function closeSearch() {
    setSearchFocused(false)
    setSearchQuery("")
  }

  function switchRail(id: RailId) {
    setRail(id)
    setSelectedPlace(null)
    setEditorMode(false)
    setSelectedMarker(null)
    setSearchFocused(false)
    setSearchQuery("")
  }

  function toggleLayer(layer: string) {
    setActiveLayers(prev => {
      const next = new Set(prev)
      next.has(layer) ? next.delete(layer) : next.add(layer)
      return next
    })
  }

  function resetAll() {
    setRail("map")
    setSearchFocused(false)
    setSearchQuery("")
    setSelectedPlace(null)
    setEditorMode(false)
    setSelectedMarker(null)
  }

  // ── State label (for breadcrumb) ──

  const stateLabel =
    editorMode && selectedMarker ? `editor › ${selectedMarker.label}`
    : editorMode                  ? `editor (${editorTool})`
    : selectedPlace               ? `place › ${selectedPlace.label} › ${placeTab}`
    : searchFocused               ? `search${searchQuery ? ` › "${searchQuery}"` : " (open)"}`
    : `${rail} rail`

  const inNonDefault = editorMode || selectedPlace || searchFocused

  // ── Panel content ──

  function renderPanel() {
    if (searchFocused) {
      return (
        <SearchPanel
          query={searchQuery}
          onSelectPlace={goToPlace}
        />
      )
    }
    if (editorMode && selectedMarker) {
      return (
        <MarkerDetailPanel
          marker={selectedMarker}
          onBack={() => setSelectedMarker(null)}
        />
      )
    }
    if (selectedPlace) {
      return (
        <PlacePanel
          place={selectedPlace}
          placeTab={placeTab}
          onTabChange={setPlaceTab}
          onBack={() => setSelectedPlace(null)}
          onOpenEditor={openEditor}
          onSelectMarker={m => { openEditor(); setSelectedMarker(m) }}
        />
      )
    }
    switch (rail) {
      case "locations":   return <LocationsPanel onSelect={goToPlace} />
      case "collections": return (
        <CollectionsPanel
          collTab={collTab}
          onCollTabChange={setCollTab}
          expandedId={expandedCollection}
          onExpandToggle={id => setExpandedCollection(prev => prev === id ? null : id)}
        />
      )
      case "layers":  return <LayersPanel activeLayers={activeLayers} onToggle={toggleLayer} />
      case "recents": return <RecentsPanel onSelect={goToPlace} />
      default:        return <NullPanel onClickRecent={goToPlace} />
    }
  }

  return (
    <div className="space-y-4">
      <Callout variant="info" title="Interactive prototype">
        Functional state-machine prototype of the Maps 2.0 left-sidebar IA. Click the rail icons, search bar, recents, place items, and editor markers to navigate between states.
      </Callout>

      {/* State breadcrumb */}
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        <span className="font-medium">State:</span>
        <code className="rounded border border-border bg-muted/50 px-2 py-0.5 text-xs">{stateLabel}</code>
        {inNonDefault && (
          <button className="text-muted-foreground hover:text-foreground underline underline-offset-2" onClick={resetAll}>
            reset
          </button>
        )}
      </div>

      {/* Prototype frame */}
      <div className="relative rounded-xl border border-border overflow-hidden bg-card" style={{ height: 560 }}>

        {/* Editor toolbar */}
        {editorMode && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 rounded-lg border border-border bg-card/95 px-3 py-1.5 shadow-xl text-[11px] backdrop-blur-sm">
            <span className="rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 font-semibold text-[10px]">Editor</span>
            <span className="h-4 w-px bg-border mx-0.5" />
            {EDITOR_TOOLS.map(t => (
              <button
                key={t}
                onClick={() => setEditorTool(t)}
                className={cn(
                  "px-2 py-0.5 rounded transition-colors",
                  t === editorTool
                    ? "bg-muted border border-border font-semibold"
                    : "hover:bg-muted/60 text-muted-foreground hover:text-foreground",
                )}
              >
                {t}
              </button>
            ))}
            <span className="h-4 w-px bg-border mx-0.5" />
            <button onClick={exitEditor} className="text-muted-foreground hover:text-foreground px-1 font-bold">✕</button>
          </div>
        )}

        {/* Map canvas */}
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse 70% 60% at 60% 50%, oklch(0.3 0.04 220), oklch(0.15 0.02 220))" }}
          onClick={() => { if (searchFocused) closeSearch() }}
        >
          {/* Device markers */}
          {MARKERS.map(marker => (
            <button
              key={marker.id}
              style={{ left: `${marker.x}%`, top: `${marker.y}%`, transform: "translate(-50%,-50%)" }}
              className={cn(
                "absolute rounded-full ring-2 transition-all duration-150",
                marker.status === "Online"
                  ? "bg-emerald-400/85 ring-emerald-400/30"
                  : "bg-red-400/85 ring-red-400/30",
                editorMode
                  ? "size-3 cursor-pointer hover:scale-150 hover:ring-white/40"
                  : "size-2 cursor-default",
                selectedMarker?.id === marker.id && "scale-150 ring-white/60 z-10",
              )}
              onClick={e => {
                e.stopPropagation()
                if (editorMode) setSelectedMarker(marker)
              }}
              title={editorMode ? marker.label : undefined}
            />
          ))}

          {/* Active layers strip */}
          {activeLayers.size > 0 && (
            <div className="absolute bottom-10 right-4 flex flex-col items-end gap-1">
              {[...activeLayers].slice(0, 3).map(l => (
                <div key={l} className="rounded-full border border-border/60 bg-card/90 text-[9px] text-muted-foreground px-2 py-0.5 backdrop-blur-sm">
                  {l}
                </div>
              ))}
              {activeLayers.size > 3 && (
                <div className="rounded-full border border-border/60 bg-card/90 text-[9px] text-muted-foreground px-2 py-0.5">
                  +{activeLayers.size - 3} more
                </div>
              )}
            </div>
          )}

          {/* Map UI chrome */}
          <div className="absolute top-3 right-3 text-[10px] text-white/25 font-mono select-none">
            {selectedPlace?.kind === "floor" ? selectedPlace.label + " · Main Bldg" : "Floor 3 · Main Bldg"}
          </div>
          <div className="absolute top-3 right-28 rounded-full border border-border/60 bg-card/90 text-[10px] text-muted-foreground px-3 py-1 backdrop-blur-sm select-none">
            🏢 HQ-MAIN
          </div>
          <div className="absolute bottom-4 right-4 flex flex-col gap-0.5">
            {["+", "−"].map(z => (
              <button key={z} className="size-7 rounded border border-border/50 bg-card/80 text-xs font-bold text-muted-foreground hover:bg-card transition-colors">
                {z}
              </button>
            ))}
          </div>
        </div>

        {/* Left rail */}
        <div className="absolute left-0 top-0 bottom-0 w-10 border-r border-border/50 bg-card/95 flex flex-col items-center py-3 gap-2 z-10">
          {RAIL_ITEMS.map(item => (
            <button
              key={item.id}
              title={item.label}
              onClick={() => switchRail(item.id)}
              className={cn(
                "size-8 rounded-lg flex items-center justify-center transition-colors text-base",
                rail === item.id && !selectedPlace && !editorMode && !searchFocused
                  ? "bg-muted border border-border"
                  : "hover:bg-muted/60",
              )}
            >
              {item.icon}
            </button>
          ))}
        </div>

        {/* Left panel */}
        <div className="absolute left-10 top-0 bottom-0 w-64 border-r border-border/50 bg-card/95 z-10 flex flex-col overflow-hidden">
          {/* Search bar */}
          <div className="p-2 border-b border-border/50 shrink-0 relative">
            <div
              className={cn(
                "rounded-lg border px-2.5 py-1.5 text-xs flex items-center gap-2 cursor-text transition-colors",
                searchFocused
                  ? "border-foreground/40 bg-muted/70"
                  : "border-border bg-muted/50 text-muted-foreground hover:border-foreground/20",
              )}
              onClick={() => setSearchFocused(true)}
            >
              <span className="shrink-0">🔍</span>
              {searchFocused ? (
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search Verkada Maps…"
                  className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground min-w-0"
                  onClick={e => e.stopPropagation()}
                />
              ) : (
                <span className="flex-1">Search Verkada Maps…</span>
              )}
              {searchFocused && (
                <button
                  onClick={e => { e.stopPropagation(); closeSearch() }}
                  className="text-muted-foreground hover:text-foreground ml-auto shrink-0"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Panel body */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {renderPanel()}
          </div>
        </div>
      </div>
    </div>
  )
}
