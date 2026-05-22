export type Verdict = "adopt" | "adapt" | "reject" | "new"

export const VERDICT_LABEL: Record<Verdict, string> = {
  adopt: "Adopt as-is",
  adapt: "Adapt to Verkada",
  reject: "Reject / N/A",
  new: "New (Verkada-only)",
}

export const VERDICT_COLOR: Record<Verdict, string> = {
  adopt: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  adapt: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  reject: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  new: "bg-neutral-500/15 text-neutral-300 border-neutral-500/30",
}

// ─── Tab 1: Full Audit ───────────────────────────────────────────────────────

export const FULL_AUDIT_ROWS: Array<{
  gmaps: string
  verkada: string
  verdict: Verdict
  rationale: string
}> = [
  { gmaps: "Persistent left rail (Saved, Recents, Get app)", verkada: "Persistent left rail: Map, Collections, Recents, Editor, Profile", verdict: "adapt", rationale: "Same icon-rail anchor. Swap 'Get app' for 'Editor' entry. Always-visible auth-gated jump points." },
  { gmaps: "Search Google Maps (top-of-panel combobox + autocomplete grid)", verkada: "Search Verkada Maps (Places, Markers, Devices, Sites, Collections in one combobox)", verdict: "adopt", rationale: "Search-first IA is the single biggest pattern to lift. Federated across all entity types with type-prefixed suggestions." },
  { gmaps: "Quick category chips (Restaurants, Hotels, Things to do, ATMs…)", verkada: "Quick filters: Cameras, Doors, Sensors, Alerts, Offline, Lockdowns, My sites", verdict: "adapt", rationale: "One-click intent shortcuts. Verkada categories are device classes + operational states instead of consumer POI categories." },
  { gmaps: "Hamburger Menu drawer (17 flat menuitems)", verkada: "Menu drawer (Editor, Permissions, Imports, Bulk, History, Help)", verdict: "adapt", rationale: "Keep the flat list pattern. Items become Verkada admin/editor surfaces, not consumer ones." },
  { gmaps: "Directions panel (mode tabs, origin/destination, route list)", verkada: "N/A (no routing)", verdict: "reject", rationale: "Pure navigation/wayfinding. Verkada Maps is a security operations view, not a wayfinder. Do not build." },
  { gmaps: "Place details: header photo, rating, action row, Overview/Reviews/About tabs", verkada: "Place panel: name, basemap thumb, action row (Details, Edit, Share, Permissions, Nearby), tabs: Overview / Markers / Activity / About", verdict: "adapt", rationale: "The strongest pattern after search. Same shape, Verkada-native tabs. Reviews → Activity. About → permissions & metadata." },
  { gmaps: "Save button → list picker popover (Favorites, Want to go, custom)", verkada: "Add to Collection popover (system + custom Collections, New Collection)", verdict: "adopt", rationale: "1:1 mapping. Google Maps 'Lists' = Verkada 'Collections'. Use the same multi-select popover with a 'New Collection' affordance." },
  { gmaps: "Send to phone, Share, Embed a map", verkada: "Send to mobile (Command app), Share link, Embed view (later)", verdict: "adapt", rationale: "Same affordances, scoped to permitted recipients. Embed is post-V1." },
  { gmaps: "Nearby (button under place)", verkada: "Nearby (re-seeds search with 'near <Place>' to find adjacent assets)", verdict: "adopt", rationale: "Excellent for security ops: 'show cameras near this door', 'show sensors near this elevator'." },
  { gmaps: "Search results: filter chips (Hours, Rating, Price), All filters sheet", verkada: "Results: filters (Site, Device type, Status, Owner, Tag), Advanced filters sheet", verdict: "adapt", rationale: "Dynamic filter chips based on result class. Hours/Price replaced with Site, Status, Device type." },
  { gmaps: "'Search this area' floating button + 'Update results when map moves' toggle", verkada: "Same affordance, scoped to the visible viewport across spatial hierarchy", verdict: "adopt", rationale: "Essential pattern for any map-anchored list. Lift verbatim." },
  { gmaps: "Saved → Lists / Labeled / Visited / Maps / Offline / Following", verkada: "Collections → My Collections / Shared with me / Following / Recent / System (Favorites, Watchlist)", verdict: "adapt", rationale: "Same surface, simpler taxonomy. Drop Labeled and Offline (V1). Visited maps to Recents." },
  { gmaps: "Your timeline (location history)", verkada: "Activity timeline (events, alerts, badge swipes for a Place)", verdict: "adapt", rationale: "Different data, same UX. Time-scrubber + day cards + filter by entity type." },
  { gmaps: "Your contributions (reviews, photos, edits)", verkada: "My edits (places, layouts, marker plots) with edit history & status", verdict: "adapt", rationale: "Editor-focused contribution log. Critical for audit trail in security context." },
  { gmaps: "Your data in Maps (Location History, Web Activity)", verkada: "My data in Maps (placement history, share log, permissions audit)", verdict: "adapt", rationale: "Privacy/audit surface. Verkada equivalent is compliance-oriented." },
  { gmaps: "Add a missing place / Add your business / Edit the map", verkada: "New Location / New Building / New Floor (Editor entry points)", verdict: "adapt", rationale: "Authoring entry. Verkada has Editor mode with stricter permissions and required Site selection." },
  { gmaps: "Layers panel (Transit, Traffic, Satellite, Terrain, Wildfires, Air Quality)", verkada: "Data Layers panel (Device Status, Coverage, Events, Foot Traffic, Door Schedules, Occupancy, Emergency, …)", verdict: "adapt", rationale: "Direct analog. Verkada has 12 layers vs Google's ~7. Same toggle UX, layered by category." },
  { gmaps: "Map type: Default / Satellite / Globe / Labels", verkada: "Basemap style: Streets / Satellite / Hybrid / Dark (Mapbox-backed)", verdict: "adopt", rationale: "Same control. Sits in the same Layers panel." },
  { gmaps: "Travel time / Measure (Map tools)", verkada: "Measure tool (distance, area) + Coverage simulator", verdict: "adapt", rationale: "Measure pattern lifts cleanly. Travel time has no Verkada use." },
  { gmaps: "Sign-in upsells throughout signed-out experience", verkada: "N/A (auth-required product, no signed-out state)", verdict: "reject", rationale: "Verkada is enterprise-auth. No public/anonymous surface." },
  { gmaps: "Profile / account avatar in header", verkada: "Command global header (org switcher, user, search) — already exists", verdict: "reject", rationale: "Owned by Command shell, not Maps. Maps inherits the global Command chrome." },
  { gmaps: "(No equivalent)", verkada: "Site filter / Site scope selector (persistent)", verdict: "new", rationale: "Verkada-specific. Sites are RBAC buckets, not spatial. Need a persistent way to scope every panel by Site." },
  { gmaps: "(No equivalent)", verkada: "Spatial breadcrumb (Org › Location › Building › Floor › Area)", verdict: "new", rationale: "Verkada has 4-deep spatial hierarchy. Google Maps is 1-level. Need persistent breadcrumb at top of every Place panel." },
  { gmaps: "(No equivalent)", verkada: "Editor / Viewer mode switch", verdict: "new", rationale: "Google has implicit edit-by-suggestion. Verkada needs explicit Editor mode with its own tool palette." },
  { gmaps: "(No equivalent)", verkada: "Emergency state banner (lockdown, active alarm) at top of panel", verdict: "new", rationale: "Verkada-only. Data Layer DL11 surfaces this; needs persistent top-of-panel treatment, not just an overlay." },
]

// ─── Tab 2: Patterns ─────────────────────────────────────────────────────────

export type Pattern = {
  name: string
  whatGoogleDoes: string
  whyItWorks: string
  verkadaApplication: string
  appliesTo: string[]
  priority: "P0" | "P1" | "P2"
}

export const PATTERNS: Pattern[] = [
  { name: "Search-first information architecture", whatGoogleDoes: "Search box is the primary, always-focused entry point at the top of the left panel. Every IA branch (Directions, Place, Saved, Layers) is reachable but secondary to typing.", whyItWorks: "Users think in intents, not menus. Typing 'pharmacy near me' is faster than navigating a tree. Reduces hierarchy depth.", verkadaApplication: "Make federated search the primary entry. Search Places, Markers, Devices, Sites, Collections, Events from one combobox. Type-prefix suggestions group results by entity class.", appliesTo: ["Default view", "Search results", "Editor"], priority: "P0" },
  { name: "Persistent thin icon rail", whatGoogleDoes: "A 4-icon rail (Saved, Recents, Get app, …) sits at the far-left edge of the sidebar at all times, regardless of which panel is active.", whyItWorks: "Gives users a stable jumppoint set. Stays anchored when the main panel content swaps between Search, Directions, Place, Saved.", verkadaApplication: "Persistent rail with: Map (home), Collections, Recents, Editor, Permissions, Profile. Always visible across Viewer and Editor modes.", appliesTo: ["All panels"], priority: "P0" },
  { name: "Hamburger drawer as flat menu", whatGoogleDoes: "The 'Menu' button opens a single-level list of 17 destinations. No accordion, no submenus. Each item swaps the main panel.", whyItWorks: "Discoverability without nesting penalty. Power-user destinations stay one click away.", verkadaApplication: "Hamburger drawer holds admin/editor destinations: Editor mode, Imports, Bulk actions, Permissions audit, Activity, Settings, Help. Keep flat — no submenus.", appliesTo: ["All panels"], priority: "P1" },
  { name: "Tabbed entity detail panel", whatGoogleDoes: "Place details uses 3 tabs (Overview / Reviews / About) plus conditional Menu and Updates. Action button row sits above tabs.", whyItWorks: "Splits dense content into 3 cognitive buckets: 'what is this', 'what do others say', 'metadata'. Action row is always one click away.", verkadaApplication: "Place panel tabs: Overview / Markers / Activity / About. Action row: Open in Editor, Share, Add to Collection, Permissions, Nearby.", appliesTo: ["Place panel (Location, Building, Floor, Area)"], priority: "P0" },
  { name: "Action button row (consistent set)", whatGoogleDoes: "Directions, Save, Nearby, Send to phone, Share. Same 5 buttons on every place, in the same order.", whyItWorks: "Muscle memory. Cross-place consistency. Users never hunt for primary actions.", verkadaApplication: "Standard 5-button row across every Place, Marker, and Collection: Open in Editor, Add to Collection, Share, Permissions, Nearby. Order is fixed.", appliesTo: ["Every entity panel"], priority: "P0" },
  { name: "Save-to-list popover (multi-select with create)", whatGoogleDoes: "Save button opens a popover with checkboxes for system lists (Favorites, Want to go) and custom lists, plus a 'New list' button at the bottom.", whyItWorks: "One affordance for two jobs: assign to existing list, or create-and-assign in the same gesture.", verkadaApplication: "'Add to Collection' popover with system Collections (Favorites, Watchlist) + user Collections + 'New Collection'. Inherits Verkada permission rules.", appliesTo: ["Every entity panel"], priority: "P0" },
  { name: "Filter chip row above results", whatGoogleDoes: "Top of results: dynamic chips (Hours, Rating, Price for restaurants; different chips for hotels) + 'All filters' sheet.", whyItWorks: "Filters surface 70% of intent in one tap. The 'All filters' escape hatch handles the long tail without polluting the chip row.", verkadaApplication: "Result chips: Site, Device type, Status (online/offline), Owner, Tag, Date range. Chip set is dynamic per result class. 'Advanced filters' sheet for the long tail.", appliesTo: ["Search results", "Activity feed", "Editor lists"], priority: "P0" },
  { name: "'Update results when map moves' opt-in", whatGoogleDoes: "A checkbox under the result list lets users couple the result set to the viewport. 'Search this area' button appears when decoupled.", whyItWorks: "Honors two user modes (browsing vs. pinned search) without forcing a choice up front.", verkadaApplication: "Identical pattern: 'Update results when map moves' toggle + 'Search this area' button. Critical for security ops scoping cameras to a viewport.", appliesTo: ["Search results", "Activity feed"], priority: "P1" },
  { name: "Layers panel (categorized toggleable overlays)", whatGoogleDoes: "Layers panel groups overlays by category: Map details (Transit, Traffic, Biking…), Map tools (Travel time, Measure), Map type.", whyItWorks: "Clear separation between data overlays (state) and rendering choices (basemap). Users can hold multiple toggles on at once.", verkadaApplication: "Data Layers panel grouped: Context, Device State, Operations, Analytics, Emergency. 12 toggles total. Sources (Devices & Entities) + Outputs (Visualizations) are compositionally independent.", appliesTo: ["Map viewport (all modes)"], priority: "P0" },
  { name: "Breadcrumb / back navigation in every subpanel", whatGoogleDoes: "Every secondary panel has an explicit Back arrow at the top-left, not relying on browser back.", whyItWorks: "Spatial orientation. Users always know where they are and how to go up one level.", verkadaApplication: "Place panels show a 4-level spatial breadcrumb (Org › Location › Building › Floor › Area). Every drilldown panel has explicit Back. Browser back is a fallback, not the path.", appliesTo: ["Every drilldown panel"], priority: "P0" },
  { name: "Nearby (re-seed search by context)", whatGoogleDoes: "Place panel has a 'Nearby' button that re-seeds the search box with 'near <place>' so users can find adjacent things without losing context.", whyItWorks: "Bridges 'I'm looking at X' to 'now show me Y near X' in one click. Preserves the spatial anchor.", verkadaApplication: "Highest leverage for security ops: 'cameras near this door', 'sensors near this elevator', 'doors near this alarm zone'. One button, scoped to the active Place.", appliesTo: ["Place panel"], priority: "P0" },
  { name: "Auth-gated rail items redirect gracefully", whatGoogleDoes: "Clicking Saved/Recents when signed-out redirects to a sign-in page, then returns to the action.", whyItWorks: "Doesn't hide auth-gated affordances; surfaces the gate at the moment of intent.", verkadaApplication: "Permissioned items (e.g., Editor, Activity for Sites you can't view) show the affordance but trigger a permission-request flow on click instead of hiding.", appliesTo: ["Rail", "Menu drawer"], priority: "P1" },
]

// ─── Tab 3: NAV Tree ─────────────────────────────────────────────────────────

export type NavNode = {
  label: string
  depth: number
  kind?: "rail" | "search" | "tab" | "button" | "drawer" | "panel" | "filter" | "layer" | "input" | "section"
  note?: string
  source?: string
}

export const NAV_TREE: NavNode[] = [
  { label: "Persistent left rail (always visible)", depth: 0, kind: "rail" },
  { label: "Map (live map view)", depth: 1, kind: "button", source: "GMaps default view" },
  { label: "Locations", depth: 1, kind: "button", note: "Verkada-only. Top-level container for all spatial entities." },
  { label: "Locations directory (browse / search / filter)", depth: 2 },
  { label: "New Location (button)", depth: 2 },
  { label: "Pick a Location → opens Place panel", depth: 2 },
  { label: "Collections", depth: 1, kind: "button", source: "GMaps Saved" },
  { label: "Data Layers", depth: 1, kind: "button", note: "Verkada-only. Visibility controls for product families + visualizations." },
  { label: "Recents", depth: 1, kind: "button", source: "GMaps Recents" },
  { label: "Profile / org switcher", depth: 1, kind: "button", note: "Owned by Command shell" },
  { label: "Top of panel (always visible above any view)", depth: 0, kind: "section", note: "Two co-primary controls: Search (geography) and Site scope (logical visibility). Side-by-side, neither subordinate." },
  { label: "Search Verkada Maps (combobox) — GEOGRAPHY (primary axis A)", depth: 1, kind: "search", source: "GMaps search-first", note: "Resolves Places, Markers, Collections, and Sites." },
  { label: "Autocomplete (grouped by entity class)", depth: 2, kind: "panel" },
  { label: "Places (Location, Building, Floor, Area, Sub-area)", depth: 3 },
  { label: "Markers (Devices, Entities, Annotations)", depth: 3 },
  { label: "Collections", depth: 3 },
  { label: "Sites — resolves to associated Places", depth: 3, note: "Sites have no geography. Result header: '{Site} is associated with these places:'" },
  { label: "Recent searches", depth: 3 },
  { label: "Site scope control — LOGICAL VISIBILITY (primary axis B)", depth: 1, kind: "filter", note: "Verkada-only. Lives in Maps top-of-panel. Determines which devices and entities are visible. Persists across navigation." },
  { label: "Current scope chip ('All my sites' / 'N sites: A, B, C' / single site)", depth: 2 },
  { label: "Click chip → Site scope picker", depth: 2 },
  { label: "Pick one or many sites (multi-select)", depth: 3 },
  { label: "Site hierarchy (sub-sites under parent sites)", depth: 3 },
  { label: "Reset to 'All my sites' (default)", depth: 3 },
  { label: "Show 'what changes when I scope?' preview", depth: 3 },
  { label: "Mental model: Geography × Logical scope", depth: 1, kind: "section", note: "These axes compose. 'Show me SF Office (geography) for Executive Eyes Only sites (scope)' filters to the intersection." },
  { label: "Spatial breadcrumb", depth: 0, kind: "section", note: "Verkada-only. Linear path to active node." },
  { label: "Path format: Org › Location › (Building) › (Floor | Area) › (Area | Sub-area)", depth: 1 },
  { label: "Example (floor path): Org › HQ Campus › Main Bldg › Floor 1", depth: 2 },
  { label: "Example (sibling area): Org › HQ Campus › Main Bldg › Front Lawn (Area)", depth: 2, note: "Same Building. Front Lawn is an Area sibling to Floor 1." },
  { label: "Example (Areas at Location): Org › East Parking Lot › Row A › Stall 12", depth: 2 },
  { label: "Sibling switcher in breadcrumb (dropdown on each level)", depth: 1, note: "Click any breadcrumb segment to see siblings at that level." },
  { label: "Data Layers (top-level navigational concept)", depth: 0, kind: "panel", note: "Two paired halves: (A) Devices & Entities = SOURCES; (B) Visualizations = OUTPUTS. Both halves are independently toggleable and composable." },
  { label: "(A) Devices & Entities — SOURCES", depth: 1, kind: "section" },
  { label: "Cameras", depth: 2, kind: "layer" },
  { label: "Access Control (doors, readers, ACUs)", depth: 2, kind: "layer" },
  { label: "Alarms", depth: 2, kind: "layer" },
  { label: "Sensors (environmental, occupancy)", depth: 2, kind: "layer" },
  { label: "Intercoms", depth: 2, kind: "layer" },
  { label: "Guard / Patrol", depth: 2, kind: "layer" },
  { label: "Gateways / Connectivity", depth: 2, kind: "layer" },
  { label: "(B) Visualizations — OUTPUTS", depth: 1, kind: "section" },
  { label: "V1 launch core", depth: 2, kind: "section" },
  { label: "Basemap (Streets / Satellite / Hybrid / Dark)", depth: 3, kind: "layer", source: "GMaps Map type" },
  { label: "Marker identity (always on — non-toggleable)", depth: 3, kind: "layer" },
  { label: "Device Status (online / offline / health)", depth: 3, kind: "layer" },
  { label: "Clustered markers (zoom-based aggregation)", depth: 3, kind: "layer" },
  { label: "Coverage (camera FOV, gateway range, sensor radius)", depth: 3, kind: "layer" },
  { label: "Events & Alerts (real-time + historical)", depth: 3, kind: "layer" },
  { label: "Post-launch tier (later)", depth: 2, kind: "section" },
  { label: "Foot Traffic / Badge Activity", depth: 3, kind: "layer" },
  { label: "Patrol / Guard routes", depth: 3, kind: "layer" },
  { label: "Door Schedules", depth: 3, kind: "layer" },
  { label: "Building Occupancy", depth: 3, kind: "layer" },
  { label: "Measurements (perimeter, area, distance)", depth: 3, kind: "layer" },
  { label: "Emergency State", depth: 3, kind: "layer" },
  { label: "Time-series playback", depth: 3, kind: "layer" },
  { label: "Hamburger menu drawer", depth: 0, kind: "drawer", source: "GMaps Menu" },
  { label: "Imports & bulk actions", depth: 1 },
  { label: "History & audit log", depth: 1 },
  { label: "Settings", depth: 1 },
  { label: "Get help", depth: 1 },
  { label: "Send feedback", depth: 1 },
  { label: "Default panel (when nothing else selected)", depth: 0, kind: "panel" },
  { label: "Active Location header", depth: 1, kind: "section" },
  { label: "Location name + Site badges", depth: 2 },
  { label: "Alerts & events context (always-on, permission-scoped)", depth: 1, kind: "section" },
  { label: "Emergency banner (if active emergency)", depth: 2 },
  { label: "Active alerts (last N, filterable by severity)", depth: 2 },
  { label: "Recent events (badge swipes, motion, door forced-open, etc.)", depth: 2 },
  { label: "Recents (last 5 places / events)", depth: 1, source: "GMaps Recents" },
  { label: "Pinned Collections", depth: 1 },
  { label: "Place panel (Location / Building / Floor / Area / Sub-area)", depth: 0, kind: "panel" },
  { label: "Back arrow + spatial breadcrumb", depth: 1, source: "GMaps Back" },
  { label: "Header", depth: 1, kind: "section" },
  { label: "Photo / layout thumbnail", depth: 2 },
  { label: "Place name (heading)", depth: 2 },
  { label: "Type chip (Location / Building / Floor / Area)", depth: 2 },
  { label: "Site badges", depth: 2, note: "Verkada-only" },
  { label: "Health indicator (devices online / total)", depth: 2, note: "Verkada-only" },
  { label: "Action button row", depth: 1, kind: "section", source: "GMaps action row" },
  { label: "Open in Editor", depth: 2 },
  { label: "Add to Collection (popover)", depth: 2, source: "GMaps Save → list picker" },
  { label: "Share", depth: 2 },
  { label: "Permissions", depth: 2, note: "Contextual" },
  { label: "Nearby", depth: 2, source: "GMaps Nearby" },
  { label: "Tabs (Overview / Markers / Activity / About)", depth: 1, kind: "tab" },
  { label: "Overview", depth: 2 },
  { label: "Markers tab", depth: 2 },
  { label: "Filter chips (type, status, owner, tag)", depth: 3 },
  { label: "Marker list (rows: name, type, status, last seen)", depth: 3 },
  { label: "Activity tab", depth: 2, source: "GMaps Reviews + Your timeline" },
  { label: "Time-scrubber (day / week / custom)", depth: 3 },
  { label: "Event list (alerts, badge swipes, lockdowns)", depth: 3 },
  { label: "About / Metadata tab", depth: 2, source: "GMaps About" },
  { label: "Address / coordinates / plus code", depth: 3 },
  { label: "Permissions (sites, roles, sharing)", depth: 3, note: "Verkada-only" },
  { label: "Edit history (who, when, what)", depth: 3, note: "Verkada-only" },
  { label: "Editor mode (CONTEXTUAL — only reachable from a Place panel)", depth: 0, kind: "panel", note: "Verkada-only. Entry exclusively via 'Open in Editor' in a Place panel. Scope = that Place." },
  { label: "Toolbar: Plotting tools", depth: 1 },
  { label: "Architectural: Wall, Door, Window, Elevator, Stairs", depth: 2 },
  { label: "Verkada: Devices (cameras, ACUs, sensors…), Entities", depth: 2 },
  { label: "Annotations: Labels, non-Verkada objects", depth: 2 },
  { label: "Canvas controls (3D orbit, show/hide layers, re-center, zoom to fit)", depth: 1 },
  { label: "Directory (left-rail inside Editor: all markers in this Place)", depth: 1 },
  { label: "Save / publish (exits Editor mode back to Place panel)", depth: 1 },
  { label: "Collections panel (opened from rail)", depth: 0, kind: "panel", source: "GMaps Saved (1:1 model)", note: "Collections contain spatial entities only. Never directly contain Sites." },
  { label: "Section chips: My Collections / Shared with me / Following / System", depth: 1, kind: "filter" },
  { label: "Collection rows (name, item count, sharing icon, last updated)", depth: 1 },
  { label: "New Collection (button)", depth: 1, source: "GMaps New list" },
  { label: "Collection detail", depth: 1 },
  { label: "Filter chips: by type (Location, Building, Floor, Area, File, Boundary)", depth: 2 },
  { label: "Item list (places + files + boundaries, never Sites)", depth: 2 },
  { label: "Recents panel (from rail)", depth: 0, kind: "panel", source: "GMaps Recents" },
  { label: "Filter chips: All / Locations / Markers / Events / Collections", depth: 1 },
  { label: "Recent items list (type icon, name, timestamp, jump-to)", depth: 1 },
  { label: "Search results panel (Google Maps-style)", depth: 0, kind: "panel", source: "GMaps search results" },
  { label: "Filter chips (dynamic per result class)", depth: 1 },
  { label: "Advanced filters sheet ('All filters')", depth: 1 },
  { label: "'Search this area' floating button", depth: 1 },
  { label: "'Update results when map moves' toggle", depth: 1 },
  { label: "Result list (cards by entity class)", depth: 1 },
]

// ─── Tab 5: GMaps Deep Audit ──────────────────────────────────────────────────

export type DeepPanel = {
  num: string
  title: string
  entry: string
  google: string[]
  verkada: string[]
  verdict: Verdict
  flag?: string
  blocked?: boolean
}

export const DEEP_PANELS: DeepPanel[] = [
  {
    num: "1", title: "Saved / Your Lists", entry: "Left rail \"Saved\" button", blocked: true,
    google: [
      "Hard sign-in redirect on click. No teaser, no empty state, no preview.",
      "Authenticated state lists default lists (Favorites, Want to go, Starred, Travel plans) plus user-created custom lists.",
      "Each list has its own detail view with saved places rendered as pins on the map.",
    ],
    verkada: [
      "Map this to Collections, not Saved. Collections is our Saved-equivalent.",
      "Skip the gate. Users are already authenticated. Open straight into Collections.",
      "Drop Google's 'default lists' concept (Favorites, Want to go). Verkada has no semantic for those.",
      "Keep Collections in the left rail as a top-level item, same prominence Google gives Saved.",
    ],
    verdict: "adapt",
    flag: "Google's default lists (Favorites/Want to go) are consumer travel concepts. Forcing analogs into Verkada would create empty seed lists. Skip them.",
  },
  {
    num: "2", title: "Your Places", entry: "Hamburger menu → \"Your contributions\" (sign-in gated)", blocked: true,
    google: [
      "No 'Your Places' item in the visible hamburger menu in 2026 (Google removed or renamed it).",
      "Closest analog 'Your contributions' immediately redirects to sign-in.",
      "Labeled places (Home/Work) are separate from saved-list items: they are pinned, special-cased.",
    ],
    verkada: [
      "Reject the 'Your Places' bucket as a top-level concept.",
      "The closest Verkada need is Recents (already in the rail), which serves the 'places I have been touching' job better with less ceremony.",
      "Skip Google's Labeled places pattern. Sites already pin importance.",
    ],
    verdict: "reject",
    flag: "Your Places mixes too many concepts (labeled, saved, visited, maps). Recents + Collections + Site scope already cover the same jobs without the conceptual overload.",
  },
  {
    num: "3", title: "Recents / Search history", entry: "Search box focus → dropdown",
    google: [
      "Search box at top-left, dropdown opens on focus, suggestions render as user types.",
      "Suggestion types in one mixed list: exact query, query expansion, branded place chain, specific place with address.",
      "No 'Recent' section pinned to the dropdown for unauthenticated sessions.",
      "No category icons. All suggestions are plain text rows.",
      "Suggestions appear ~300ms after typing stops, no loading spinner.",
    ],
    verkada: [
      "Adopt the dropdown-on-focus pattern. Search is already the navigator in v2.",
      "Adapt: ADD category icons. Verkada result types (Place, Device, Entity, File, Collection) are more heterogeneous.",
      "Show Recents at the top of the dropdown on focus before typing. Already authenticated, so no gating.",
      "Group results by type within the dropdown (header per type) instead of a single mixed list.",
    ],
    verdict: "adapt",
    flag: "Google's flat suggestion list works because all results are essentially Places. Verkada's results span 5+ kinds; grouping and icons are non-optional.",
  },
  {
    num: "4", title: "Place detail card", entry: "Click a search result",
    google: [
      "Hero photo (16:9), place name, rating, category badge, review count, photo count.",
      "Action bar: 5 icon+label buttons (Directions, Save, Nearby, Send to phone, Share) plus a kebab.",
      "Four tabs: Overview, Menu, Reviews, About. Overview is default.",
      "Overview: address, hours (accordion), price range, website, Popular Times chart, Reviews preview.",
      "Copy-to-clipboard buttons next to address, website, phone, plus code.",
    ],
    verkada: [
      "Adopt the hero + action bar + tabbed body layout. This IS the Verkada Place card pattern.",
      "Adapt the action bar: 'Open in Editor', 'Share', 'Permissions', 'Save to Collection'.",
      "Replace tabs: Overview, Markers, Layouts, Permissions.",
      "Adopt copy-to-clipboard for all identifier-like fields: site name, location_id, device IDs.",
      "Reject in-panel review search. Markers tab has its own filter matching EntityListPanel shape.",
    ],
    verdict: "adopt",
    flag: "Google's hero photo is a marketing asset. Verkada's hero should be a floorplan thumbnail or building photo. Do not skip the hero region: it gives the panel identity at a glance.",
  },
  {
    num: "5", title: "Suggest an edit / Add a missing place", entry: "Place card → \"Suggest an edit\" button (sign-in gated)", blocked: true,
    google: [
      "'Suggest an edit' is a small text button in the Overview tab, below the plus code. Easy to miss.",
      "Click opens a 'Report a data problem' modal, immediately gated by sign-in.",
      "'Add a missing place' lives in the hamburger menu, also gated.",
      "Edit and Add are clearly secondary contributions for Google. Most users consume; few contribute.",
    ],
    verkada: [
      "Invert the prominence. File-creates-Place is a PRIMARY onboarding moment for Verkada.",
      "Adopt the form steps idea (location → building/floor → name) but reject the buried-button placement.",
      "Use the in-Files-flyout permanent dropzone (Path A) and the on-map dragover overlay (Path B).",
      "Skip Google's photo upload step. We are uploading floorplans. The wizard's last step is alignment, not photos.",
    ],
    verdict: "adapt",
    flag: "Google's Edit is a contribution flow for a public dataset (low-trust, moderated). Verkada's analog is an authenticated workflow on the user's own data (high-trust, immediate). Interaction prominence and validation model should differ.",
  },
]
