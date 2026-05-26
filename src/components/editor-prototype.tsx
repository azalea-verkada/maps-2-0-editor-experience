import { useCallback, useState } from "react";
import {
  Button,
  Callout,
  Card,
  CardBody,
  Divider,
  Grid,
  H1,
  H2,
  H3,
  Link,
  Pill,
  Row,
  Spacer,
  Stack,
  Table,
  Text,
  TextInput,
  Checkbox,
  mergeStyle,
  useCanvasState,
  useHostTheme,
} from "@/canvas-ui";

// ─── Data (mirrors nav audit mock + v3 chrome) ───────────────────────────────

type RailId = "map" | "locations" | "collections" | "layers" | "recents";
type PlaceTab = "overview" | "markers" | "activity" | "about";
type EditorTool = "Select" | "Wall" | "Door" | "Window" | "Camera" | "Sensor" | "Cable" | "Ruler" | "Area" | "Label";
type EditorEntry = "none" | "manage-home" | "in-context";
type EditorRightTab = "tools" | "devices" | "properties";
type WorkspaceFocus = "editor" | "full";
type CollTab = "mine" | "shared" | "following";
type UploadFlowStage = "idle" | "confirmed" | "locating" | "aligning" | "select-sites";

type MockLocation = {
  id: string;
  label: string;
  kind: "location" | "building" | "floor";
  site: string;
  online: number;
  total: number;
  depth: number;
};

type MockMarker = {
  id: string;
  label: string;
  kind: "Camera" | "Access Control";
  model: string;
  status: "Online" | "Offline";
  x: number;
  y: number;
};

type MockUploadedFile = {
  id: string;
  fileName: string;
  locationAddress: string | null;
};

type VerkadaAddressSource = "Site" | "Camera" | "Alarms area" | "Access door";

type VerkadaAddressSuggestion = {
  id: string;
  label: string;
  address: string;
  source: VerkadaAddressSource;
  mapCenter: { x: number; y: number };
  /** Building footprint as SVG polygon points (zoomed map % coords). */
  buildingOutline: string;
};

type AppState = {
  rail: RailId;
  searchFocused: boolean;
  searchQuery: string;
  selectedPlaceId: string | null;
  placeTab: PlaceTab;
  editorMode: boolean;
  editorEntry: EditorEntry;
  editorTool: EditorTool;
  editorRightTab: EditorRightTab;
  selectedMarkerId: string | null;
  stampActive: boolean;
  showFovCones: boolean;
  undoCount: number;
  redoCount: number;
  activeLayers: string[];
  expandedCollectionId: string | null;
  collTab: CollTab;
  sitePickerOpen: boolean;
  filesFlyoutOpen: boolean;
  layersClusterOpen: boolean;
  /** False = org has devices but no floorplan uploaded yet (first visit to Maps). */
  orgHasFloorplans: boolean;
  /** First-upload wizard: idle → confirmed → locating (per file). */
  uploadStage: UploadFlowStage;
  uploadedFiles: MockUploadedFile[];
  locatingFileId: string | null;
  locationQuery: string;
  locationSearchFocused: boolean;
  locationPinned: boolean;
  selectedAddressId: string | null;
  locationPinX: number;
  locationPinY: number;
  /** Floorplan alignment overlay controls. */
  alignOpacity: number;
  alignScale: number;
  alignRotation: number;
  alignOffsetX: number;
  alignOffsetY: number;
  /** Step 3 — link floorplan to existing Command sites. */
  siteSearchQuery: string;
  selectedSiteIds: string[];
};

type MockOrgSite = {
  id: string;
  name: string;
  code: string;
  devices: {
    cameras: number;
    accessControl: number;
    alarms: number;
    sensors: number;
  };
};

/** Existing Verkada org — devices live, Maps opened for the first time, no floorplan yet. */
function getFirstVisitDefault(): AppState {
  return {
    rail: "map",
    searchFocused: false,
    searchQuery: "",
    selectedPlaceId: null,
    placeTab: "overview",
    editorMode: false,
    editorEntry: "none",
    editorTool: "Select",
    editorRightTab: "tools",
    selectedMarkerId: null,
    stampActive: false,
    showFovCones: false,
    undoCount: 0,
    redoCount: 0,
    activeLayers: [],
    expandedCollectionId: null,
    collTab: "mine",
    sitePickerOpen: false,
    filesFlyoutOpen: false,
    layersClusterOpen: false,
    orgHasFloorplans: false,
    uploadStage: "idle",
    uploadedFiles: [],
    locatingFileId: null,
    locationQuery: "",
    locationSearchFocused: false,
    locationPinned: false,
    selectedAddressId: null,
    locationPinX: 48,
    locationPinY: 52,
    alignOpacity: 0.65,
    alignScale: 1,
    alignRotation: 0,
    alignOffsetX: 0,
    alignOffsetY: 0,
    siteSearchQuery: "",
    selectedSiteIds: [],
  };
}

function getEditorDefault(): AppState {
  return {
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
    orgHasFloorplans: true,
    uploadStage: "idle",
    uploadedFiles: [],
    locatingFileId: null,
    locationQuery: "",
    locationSearchFocused: false,
    locationPinned: false,
    selectedAddressId: null,
    locationPinX: 48,
    locationPinY: 52,
    alignOpacity: 0.65,
    alignScale: 1,
    alignRotation: 0,
    alignOffsetX: 0,
    alignOffsetY: 0,
    siteSearchQuery: "",
    selectedSiteIds: [],
  };
}

function getDefaultState(): AppState {
  return { ...getEditorDefault(), editorMode: false, editorEntry: "none", selectedPlaceId: null };
}

const LOCATIONS: MockLocation[] = [
  { id: "hq", label: "HQ Campus", kind: "location", site: "HQ-MAIN", online: 143, total: 156, depth: 0 },
  { id: "main-bldg", label: "Main Building", kind: "building", site: "HQ-MAIN", online: 80, total: 87, depth: 1 },
  { id: "floor-3", label: "Floor 3", kind: "floor", site: "HQ-MAIN", online: 42, total: 45, depth: 2 },
  { id: "east-campus", label: "East Campus", kind: "location", site: "EC-01", online: 65, total: 69, depth: 0 },
  { id: "warehouse-a", label: "Warehouse A", kind: "location", site: "WH-01", online: 23, total: 23, depth: 0 },
];

const MARKERS: MockMarker[] = [
  { id: "cam-lobby-01", label: "Cam-Lobby-01", kind: "Camera", model: "CD52", status: "Online", x: 55, y: 35 },
  { id: "cam-ne-01", label: "Cam-NE-01", kind: "Camera", model: "CD31", status: "Online", x: 65, y: 55 },
  { id: "cam-sw-04", label: "Cam-SW-04", kind: "Camera", model: "CD52", status: "Offline", x: 75, y: 42 },
  { id: "door-007", label: "Door-007", kind: "Access Control", model: "AC42", status: "Online", x: 58, y: 68 },
  { id: "cam-nw-02", label: "Cam-NW-02", kind: "Camera", model: "CD31", status: "Online", x: 70, y: 72 },
];

const COLLECTIONS = [
  { id: "hq-ext", label: "HQ External Cameras", count: 12, owned: true, shared: false },
  { id: "door-audit", label: "Door Access Audit", count: 8, owned: true, shared: false },
  { id: "parking-a", label: "Parking Zone A", count: 4, owned: false, shared: true },
];

const LAYER_GROUPS: Record<string, string[]> = {
  "Devices & Entities": ["Cameras", "Access Control", "Alarms", "Sensors"],
  Visualizations: ["Device Status", "Coverage", "Events & Alerts", "Foot Traffic"],
};

const RAIL_ITEMS: { id: RailId; abbr: string; label: string }[] = [
  { id: "map", abbr: "M", label: "Map" },
  { id: "locations", abbr: "L", label: "Locations" },
  { id: "collections", abbr: "C", label: "Collections" },
  { id: "layers", abbr: "Ly", label: "Layers" },
  { id: "recents", abbr: "R", label: "Recents" },
];

const PLACE_TABS: PlaceTab[] = ["overview", "markers", "activity", "about"];

const EDITOR_TOOL_GROUPS: { label: string; tools: EditorTool[] }[] = [
  { label: "Structural", tools: ["Wall", "Door", "Window"] },
  { label: "Devices", tools: ["Camera", "Sensor"] },
  { label: "Paths & measure", tools: ["Cable", "Ruler"] },
  { label: "Space & labels", tools: ["Area", "Label"] },
];

const EDITOR_TOOLS: EditorTool[] = ["Select", ...EDITOR_TOOL_GROUPS.flatMap((g) => g.tools)];

const UNPLACED_DEVICE_FAMILIES = ["Cameras", "Access Control", "Alarms", "Sensors"] as const;

type UnplacedDeviceFamily = (typeof UNPLACED_DEVICE_FAMILIES)[number];

type MockUnplacedDevice = {
  id: string;
  label: string;
  model: string;
  siteId: string;
  family: UnplacedDeviceFamily;
};

const UNPLACED_DEVICES: MockUnplacedDevice[] = [
  { id: "d-hq-c1", label: "Cam-Lobby-01", model: "CD52", siteId: "site-hq", family: "Cameras" },
  { id: "d-hq-c2", label: "Cam-NE-01", model: "CD31", siteId: "site-hq", family: "Cameras" },
  { id: "d-hq-a1", label: "Door-007", model: "AC42", siteId: "site-hq", family: "Access Control" },
  { id: "d-hq-al1", label: "Lobby perimeter", model: "Zone A", siteId: "site-hq", family: "Alarms" },
  { id: "d-hq-s1", label: "SV-Lobby", model: "SV23", siteId: "site-hq", family: "Sensors" },
  { id: "d-ec-c1", label: "Cam-East-01", model: "CD52", siteId: "site-east", family: "Cameras" },
  { id: "d-ec-c2", label: "Cam-Parking-02", model: "CD31", siteId: "site-east", family: "Cameras" },
  { id: "d-ec-a1", label: "Door-East-Main", model: "AC42", siteId: "site-east", family: "Access Control" },
  { id: "d-ec-s1", label: "SV-Gate", model: "SV11", siteId: "site-east", family: "Sensors" },
  { id: "d-wh-c1", label: "Cam-Dock-02", model: "CD31", siteId: "site-warehouse", family: "Cameras" },
  { id: "d-wh-a1", label: "Door-Dock-4", model: "AC41", siteId: "site-warehouse", family: "Access Control" },
  { id: "d-wh-al1", label: "Dock perimeter", model: "Zone B", siteId: "site-warehouse", family: "Alarms" },
  { id: "d-rt-c1", label: "Cam-Floor-01", model: "CD52", siteId: "site-retail", family: "Cameras" },
  { id: "d-rt-a1", label: "Door-Front", model: "AC42", siteId: "site-retail", family: "Access Control" },
  { id: "d-mfg-c1", label: "Cam-Line-03", model: "CD62", siteId: "site-plant", family: "Cameras" },
  { id: "d-mfg-c2", label: "Cam-Warehouse", model: "CD52", siteId: "site-plant", family: "Cameras" },
  { id: "d-mfg-al1", label: "Production floor", model: "Zone C", siteId: "site-plant", family: "Alarms" },
  { id: "d-mfg-s1", label: "SV-Cold-room", model: "SV23", siteId: "site-plant", family: "Sensors" },
];

const MANAGE_HOME_ROWS = [
  { building: "Main Building", floor: "Floor 3", status: "In progress", contractor: "CDMX-04", devices: "42/45" },
  { building: "Main Building", floor: "Floor 2", status: "Complete", contractor: "CDMX-02", devices: "38/38" },
  { building: "East Wing", floor: "Floor 1", status: "Not started", contractor: "—", devices: "0/12" },
];

const MOCK_UPLOAD_FILE = "Floor-1-Lobby.pdf";

const MOCK_UPLOAD_FILES = ["Floor-1-Lobby.pdf", "Floor-2-Office.pdf", "Warehouse-Level-1.png"];

const MOCK_UPLOAD_FILE_ROW: MockUploadedFile = {
  id: "file-1",
  fileName: MOCK_UPLOAD_FILE,
  locationAddress: null,
};

const VERKADA_ADDRESS_SUGGESTIONS: VerkadaAddressSuggestion[] = [
  {
    id: "site-hq",
    label: "HQ Campus · HQ-MAIN",
    address: "500 Howard St, San Francisco, CA",
    source: "Site",
    mapCenter: { x: 50, y: 52 },
    buildingOutline: "38%,38% 62%,36% 64%,58% 40%,60%",
  },
  {
    id: "cam-lobby",
    label: "Cam-Lobby-01 · CD52",
    address: "500 Howard St, San Francisco, CA · Lobby",
    source: "Camera",
    mapCenter: { x: 50, y: 52 },
    buildingOutline: "38%,38% 62%,36% 64%,58% 40%,60%",
  },
  {
    id: "alarms-lobby",
    label: "Lobby perimeter zone",
    address: "500 Howard St, San Francisco, CA · Alarms",
    source: "Alarms area",
    mapCenter: { x: 50, y: 52 },
    buildingOutline: "38%,38% 62%,36% 64%,58% 40%,60%",
  },
  {
    id: "door-main",
    label: "Door-007 · Main entry",
    address: "502 Howard St, San Francisco, CA",
    source: "Access door",
    mapCenter: { x: 51, y: 53 },
    buildingOutline: "39%,39% 63%,37% 65%,59% 41%,61%",
  },
  {
    id: "site-warehouse",
    label: "Warehouse A · WH-01",
    address: "2400 Embarcadero, Oakland, CA",
    source: "Site",
    mapCenter: { x: 48, y: 48 },
    buildingOutline: "32%,32% 68%,30% 70%,66% 34%,68%",
  },
  {
    id: "cam-dock",
    label: "Cam-Dock-02 · CD31",
    address: "2400 Embarcadero, Oakland, CA · Dock 4",
    source: "Camera",
    mapCenter: { x: 48, y: 48 },
    buildingOutline: "32%,32% 68%,30% 70%,66% 34%,68%",
  },
];

function getAddressSuggestion(id: string | null): VerkadaAddressSuggestion | undefined {
  return VERKADA_ADDRESS_SUGGESTIONS.find((s) => s.id === id);
}

function filterAddressSuggestions(query: string): VerkadaAddressSuggestion[] {
  const q = query.trim().toLowerCase();
  if (!q) return VERKADA_ADDRESS_SUGGESTIONS;
  return VERKADA_ADDRESS_SUGGESTIONS.filter(
    (s) =>
      s.label.toLowerCase().includes(q) ||
      s.address.toLowerCase().includes(q) ||
      s.source.toLowerCase().includes(q),
  );
}

const ORG_SITES: MockOrgSite[] = [
  {
    id: "site-hq",
    name: "HQ Campus",
    code: "HQ-MAIN",
    devices: { cameras: 142, accessControl: 28, alarms: 12, sensors: 45 },
  },
  {
    id: "site-east",
    name: "East Campus",
    code: "EC-01",
    devices: { cameras: 65, accessControl: 14, alarms: 6, sensors: 22 },
  },
  {
    id: "site-warehouse",
    name: "Warehouse A",
    code: "WH-01",
    devices: { cameras: 23, accessControl: 8, alarms: 4, sensors: 11 },
  },
  {
    id: "site-retail",
    name: "Retail Flagship",
    code: "RT-101",
    devices: { cameras: 38, accessControl: 6, alarms: 2, sensors: 8 },
  },
  {
    id: "site-plant",
    name: "Manufacturing Plant",
    code: "MFG-02",
    devices: { cameras: 89, accessControl: 19, alarms: 9, sensors: 31 },
  },
];

function formatSiteDeviceBreakdown(site: MockOrgSite): string {
  const { cameras, accessControl, alarms, sensors } = site.devices;
  return `${cameras} cameras · ${accessControl} access · ${alarms} alarms · ${sensors} sensors`;
}

function filterOrgSites(query: string): MockOrgSite[] {
  const q = query.trim().toLowerCase();
  if (!q) return ORG_SITES;
  return ORG_SITES.filter(
    (s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q),
  );
}

const FIRST_VISIT_PRESET_IDS = new Set([
  "first-visit",
  "empty-org",
  "manage-home-empty",
  "upload-confirmed",
  "upload-multi",
  "find-location",
  "find-location-search",
  "find-location-pinned",
  "align-floorplan",
  "select-sites",
]);

const EDITOR_PRESETS: { id: string; label: string; description: string; state: Partial<AppState> }[] = [
  {
    id: "first-visit",
    label: "0 · First visit to Maps",
    description:
      "Existing Verkada org (cameras, doors already live) — someone opens Maps for the first time. No floorplan yet; center onboarding explains “where” questions and pushes upload.",
    state: getFirstVisitDefault(),
  },
  {
    id: "upload-confirmed",
    label: "0a · Upload confirmed (1 file)",
    description: "Single floorplan uploaded — file tile appears below the drop zone (Navan-style confirmation).",
    state: { ...getFirstVisitDefault(), uploadStage: "confirmed", uploadedFiles: [MOCK_UPLOAD_FILE_ROW] },
  },
  {
    id: "upload-multi",
    label: "0a · Multi-file upload",
    description: "Two floorplans uploaded — each file needs its own location via inline Set location.",
    state: {
      ...getFirstVisitDefault(),
      uploadStage: "confirmed",
      uploadedFiles: [
        MOCK_UPLOAD_FILE_ROW,
        { id: "file-2", fileName: "Floor-2-Office.pdf", locationAddress: null },
      ],
    },
  },
  {
    id: "find-location",
    label: "0c · Set location (map)",
    description: "Map-first location picker — search bar on top, Mapbox basemap, Verkada address suggestions on focus.",
    state: {
      ...getFirstVisitDefault(),
      uploadStage: "locating",
      uploadedFiles: [MOCK_UPLOAD_FILE_ROW],
      locatingFileId: "file-1",
      locationQuery: "",
      locationSearchFocused: false,
      locationPinned: false,
      selectedAddressId: null,
    },
  },
  {
    id: "find-location-search",
    label: "0c · Set location (suggestions)",
    description: "Search focused — suggestions from sites, camera addresses, alarms areas, and access doors.",
    state: {
      ...getFirstVisitDefault(),
      uploadStage: "locating",
      uploadedFiles: [MOCK_UPLOAD_FILE_ROW],
      locatingFileId: "file-1",
      locationQuery: "",
      locationSearchFocused: true,
      locationPinned: false,
      selectedAddressId: null,
    },
  },
  {
    id: "find-location-pinned",
    label: "0c · Set location (address selected)",
    description: "Address selected on step 1 — map zoomed to building footprint, CTA to align file.",
    state: {
      ...getFirstVisitDefault(),
      uploadStage: "locating",
      uploadedFiles: [MOCK_UPLOAD_FILE_ROW],
      locatingFileId: "file-1",
      locationQuery: VERKADA_ADDRESS_SUGGESTIONS[0].address,
      locationSearchFocused: false,
      locationPinned: true,
      selectedAddressId: VERKADA_ADDRESS_SUGGESTIONS[0].id,
      locationPinX: VERKADA_ADDRESS_SUGGESTIONS[0].mapCenter.x,
      locationPinY: VERKADA_ADDRESS_SUGGESTIONS[0].mapCenter.y,
    },
  },
  {
    id: "align-floorplan",
    label: "0d · Align floorplan",
    description: "Floorplan raster overlaid on the zoomed building footprint — adjust scale, rotation, opacity before placing devices.",
    state: {
      ...getFirstVisitDefault(),
      uploadStage: "aligning",
      uploadedFiles: [{ ...MOCK_UPLOAD_FILE_ROW, locationAddress: "500 Howard St, San Francisco, CA" }],
      locatingFileId: "file-1",
      locationQuery: VERKADA_ADDRESS_SUGGESTIONS[0].address,
      locationPinned: true,
      selectedAddressId: VERKADA_ADDRESS_SUGGESTIONS[0].id,
      locationPinX: VERKADA_ADDRESS_SUGGESTIONS[0].mapCenter.x,
      locationPinY: VERKADA_ADDRESS_SUGGESTIONS[0].mapCenter.y,
      alignOpacity: 0.65,
      alignScale: 1,
      alignRotation: 0,
      alignOffsetX: 0,
      alignOffsetY: 0,
    },
  },
  {
    id: "select-sites",
    label: "0e · Select sites",
    description: "Step 3 — floorplan cropped to building; pick at least one org site with device counts before placing devices.",
    state: {
      ...getFirstVisitDefault(),
      uploadStage: "select-sites",
      uploadedFiles: [{ ...MOCK_UPLOAD_FILE_ROW, locationAddress: "500 Howard St, San Francisco, CA" }],
      locatingFileId: "file-1",
      locationQuery: VERKADA_ADDRESS_SUGGESTIONS[0].address,
      locationPinned: true,
      selectedAddressId: VERKADA_ADDRESS_SUGGESTIONS[0].id,
      locationPinX: VERKADA_ADDRESS_SUGGESTIONS[0].mapCenter.x,
      locationPinY: VERKADA_ADDRESS_SUGGESTIONS[0].mapCenter.y,
      alignOpacity: 1,
      alignScale: 1,
      alignRotation: 0,
      alignOffsetX: 0,
      alignOffsetY: 0,
      siteSearchQuery: "",
      selectedSiteIds: [],
    },
  },
  {
    id: "manage-home-empty",
    label: "0b · Manage Maps (no floorplans)",
    description: "Admin inventory when no buildings exist yet — contractor import path after first floorplan upload.",
    state: { ...getFirstVisitDefault(), editorEntry: "manage-home" },
  },
  {
    id: "manage-home",
    label: "1 · Manage Maps home",
    description: "Admin entry: org floorplan inventory, completion status, contractor assignment.",
    state: { ...getEditorDefault(), editorMode: false, editorEntry: "manage-home", selectedPlaceId: null },
  },
  {
    id: "entry-place",
    label: "2 · Entry from Place card",
    description: "Viewer on Floor 3; Open in Editor promotes to edit mode without route change.",
    state: { ...getEditorDefault(), editorMode: false, editorEntry: "none", placeTab: "overview" },
  },
  {
    id: "editor-idle",
    label: "3 · Editor idle (Select)",
    description: "In-context edit. Right panel shows tool groups. Left panel lists unplaced devices.",
    state: { ...getEditorDefault(), editorTool: "Select", editorRightTab: "tools", selectedMarkerId: null },
  },
  {
    id: "editor-plotting",
    label: "3 · Editor · Start plotting devices",
    description: "After onboarding — full editor with Draw Devices panel open; devices grouped by site and family for selected sites.",
    state: {
      ...getEditorDefault(),
      selectedSiteIds: ["site-hq", "site-east"],
      editorTool: "Select",
      editorRightTab: "devices",
      stampActive: false,
    },
  },
  {
    id: "editor-wall",
    label: "4 · Wall tool",
    description: "Vector line segments, snap-to-grid. PRD P0 structural drawing.",
    state: { ...getEditorDefault(), editorTool: "Wall", editorRightTab: "properties", selectedMarkerId: null },
  },
  {
    id: "editor-door",
    label: "5 · Door tool",
    description: "Door placement on wall segment with width + swing direction.",
    state: { ...getEditorDefault(), editorTool: "Door", editorRightTab: "properties" },
  },
  {
    id: "editor-camera-stamp",
    label: "6 · Camera stamp",
    description: "Click-to-place device tokens. Left panel filters commissioned cameras.",
    state: {
      ...getEditorDefault(),
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
      ...getEditorDefault(),
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
    state: { ...getEditorDefault(), editorTool: "Cable", editorRightTab: "properties" },
  },
  {
    id: "editor-ruler",
    label: "9 · Ruler",
    description: "Measurement lines carried forward from Site Planner ruler mode.",
    state: { ...getEditorDefault(), editorTool: "Ruler", editorRightTab: "properties" },
  },
  {
    id: "editor-area",
    label: "10 · Area / zone",
    description: "Create, name, and reshape named polygons (Lobby, Server room).",
    state: { ...getEditorDefault(), editorTool: "Area", editorRightTab: "properties" },
  },
  {
    id: "editor-label",
    label: "11 · Label",
    description: "Room names, entry/exit points as annotation tokens.",
    state: { ...getEditorDefault(), editorTool: "Label", editorRightTab: "properties" },
  },
  {
    id: "editor-marker",
    label: "12 · Device selected",
    description: "Properties inspector: model, orientation, delete. Bulk edit when multi-select.",
    state: {
      ...getEditorDefault(),
      editorTool: "Select",
      editorRightTab: "properties",
      selectedMarkerId: "cam-lobby-01",
    },
  },
  {
    id: "editor-scale",
    label: "13 · Scale & align",
    description: "Attach raster floorplan, set scale, align walls to blueprint perimeter.",
    state: { ...getEditorDefault(), editorTool: "Select", editorRightTab: "properties", filesFlyoutOpen: true },
  },
  {
    id: "editor-drop",
    label: "14 · Dragover upload",
    description: "Full-bleed drop hint on map when files drag over an open Place.",
    state: { ...getEditorDefault(), editorMode: false, editorEntry: "none", placeTab: "overview" },
  },
];

const VIEWER_PRESETS: { id: string; label: string; description: string; state: Partial<AppState> }[] = [
  {
    id: "null",
    label: "V · Null state",
    description: "Pure map. Site + Alerts cluster, no editor chrome.",
    state: getDefaultState(),
  },
  {
    id: "place",
    label: "V · Place card",
    description: "Hero + action bar before editor entry.",
    state: { ...getDefaultState(), selectedPlaceId: "floor-3", placeTab: "overview" },
  },
  {
    id: "files",
    label: "V · Files flyout",
    description: "Upload path for unplaced floorplans.",
    state: { ...getDefaultState(), filesFlyoutOpen: true },
  },
];

const PRESET_STATES = [...EDITOR_PRESETS, ...VIEWER_PRESETS];

function mergeAppState(base: AppState, patch: Partial<AppState>): AppState {
  return { ...base, ...patch };
}

function stateLabel(s: AppState): string {
  const place = LOCATIONS.find((l) => l.id === s.selectedPlaceId);
  const marker = MARKERS.find((m) => m.id === s.selectedMarkerId);
  if (!s.orgHasFloorplans && s.editorEntry === "manage-home") return "manage maps home (no floorplans)";
  if (!s.orgHasFloorplans && s.uploadStage === "select-sites") {
    const n = (s.selectedSiteIds ?? []).length;
    return `first visit › select sites${n > 0 ? ` (${n} selected)` : ""}`;
  }
  if (!s.orgHasFloorplans && s.uploadStage === "aligning") {
    return "first visit › align floorplan to building";
  }
  if (!s.orgHasFloorplans && s.uploadStage === "locating" && s.locationPinned) {
    return "first visit › address selected › align next";
  }
  if (!s.orgHasFloorplans && s.uploadStage === "locating" && (s.locationSearchFocused ?? false)) {
    return "first visit › address suggestions";
  }
  if (!s.orgHasFloorplans && s.uploadStage === "locating") {
    const file = (s.uploadedFiles ?? []).find((f) => f.id === s.locatingFileId);
    return `first visit › set location${file ? ` › ${file.fileName}` : ""}`;
  }
  if (!s.orgHasFloorplans && s.uploadStage === "confirmed" && (s.uploadedFiles ?? []).length > 0) {
    const count = (s.uploadedFiles ?? []).length;
    return `first visit › ${count} file${count === 1 ? "" : "s"} uploaded`;
  }
  if (!s.orgHasFloorplans && !s.editorMode && s.uploadStage === "idle") return "viewer › first visit › onboarding";
  if (s.editorEntry === "manage-home") return "manage maps home";
  if (s.editorMode && marker) return `editor › ${marker.label} › properties`;
  if (s.editorMode && s.stampActive) return `editor › ${s.editorTool} stamp`;
  if (s.editorMode) return `editor › ${s.editorTool} › ${s.editorRightTab}`;
  if (s.filesFlyoutOpen) return "files flyout";
  if (s.sitePickerOpen) return "site picker open";
  if (place) return `viewer › ${place.label} › ${s.placeTab}`;
  if (s.searchFocused) return `search${s.searchQuery ? ` › "${s.searchQuery}"` : " (open)"}`;
  if (s.layersClusterOpen) return `${s.rail} rail + layers cluster`;
  return `${s.rail} rail`;
}

function WireBox({
  children,
  style,
  onClick,
  title,
}: {
  children?: React.ReactNode;
  style?: Record<string, string | number>;
  onClick?: () => void;
  title?: string;
}) {
  const theme = useHostTheme();
  return (
    <div
      title={title}
      onClick={onClick}
      style={mergeStyle(
        {
          border: `1px solid ${theme.stroke.secondary}`,
          background: theme.bg.elevated,
          borderRadius: 4,
          boxSizing: "border-box",
        },
        style,
      )}
    >
      {children}
    </div>
  );
}

function Chip({ label, tone }: { label: string; tone?: "accent" | "success" | "warning" | "danger" | "neutral" }) {
  const theme = useHostTheme();
  const color =
    tone === "accent"
      ? theme.accent.primary
      : tone === "success"
        ? theme.text.link
        : tone === "warning"
          ? theme.text.secondary
          : tone === "danger"
            ? theme.diff.removed
            : theme.text.tertiary;
  return (
    <span
      style={{
        display: "inline-block",
        border: `1px solid ${theme.stroke.secondary}`,
        color,
        fontSize: 10,
        padding: "1px 6px",
        borderRadius: 999,
        lineHeight: "14px",
      }}
    >
      {label}
    </span>
  );
}

function PanelListRow({
  label,
  trailing,
  depth = 0,
  onClick,
}: {
  label: string;
  trailing?: string;
  depth?: number;
  onClick?: () => void;
}) {
  const theme = useHostTheme();
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        width: "100%",
        alignItems: "center",
        gap: 6,
        padding: "6px 8px",
        paddingLeft: 8 + depth * 12,
        border: "none",
        background: "transparent",
        color: theme.text.primary,
        cursor: onClick ? "pointer" : "default",
        fontSize: 11,
        textAlign: "left",
      }}
    >
      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
      {trailing ? <span style={{ color: theme.text.tertiary, fontSize: 10 }}>{trailing}</span> : null}
    </button>
  );
}

function ManageMapsHome({
  empty,
  onOpenFloor,
  onCreateBuilding,
  onImportFiles,
}: {
  empty?: boolean;
  onOpenFloor: () => void;
  onCreateBuilding?: () => void;
  onImportFiles?: () => void;
}) {
  const theme = useHostTheme();
  return (
    <Stack gap={12} style={{ padding: 16, height: "100%", overflow: "auto" }}>
      <Stack gap={4}>
        <Text weight="semibold">Manage Maps</Text>
        <Text size="small" tone="secondary">
          {empty
            ? "Start here for a new org — create buildings, import contractor files, then open floors in the editor."
            : "Org floorplan inventory — CDMX contractors land here to pick up assigned buildings."}
        </Text>
      </Stack>
      <Row gap={8} wrap>
        {empty ? (
          <>
            <Button variant="primary" onClick={onCreateBuilding}>
              Create first building
            </Button>
            <Button variant="secondary" onClick={onImportFiles}>
              Import files
            </Button>
          </>
        ) : (
          <>
            <Button variant="primary">New building</Button>
            <Button variant="secondary">Import files</Button>
            <Button variant="secondary">Assign contractor</Button>
          </>
        )}
      </Row>
      <WireBox style={{ padding: 0, overflow: "hidden" }}>
        {empty ? (
          <Table
            headers={["Building", "Floor", "Status", "Contractor", "Devices"]}
            rows={[]}
            framed={false}
            emptyMessage={
              <Stack gap={8} style={{ alignItems: "center", padding: "24px 16px", textAlign: "center" }}>
                <Text weight="semibold">No buildings yet</Text>
                <Text size="small" tone="secondary">
                  Floorplans and device placement live inside buildings. Create one to unlock the map editor.
                </Text>
                <Button variant="primary" onClick={onCreateBuilding}>
                  Create first building
                </Button>
              </Stack>
            }
          />
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
                gap: 8,
                padding: "8px 12px",
                borderBottom: `1px solid ${theme.stroke.tertiary}`,
                fontSize: 10,
                color: theme.text.tertiary,
                textTransform: "uppercase",
              }}
            >
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
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
                  gap: 8,
                  width: "100%",
                  padding: "10px 12px",
                  border: "none",
                  borderBottom: `1px solid ${theme.stroke.tertiary}`,
                  background: "transparent",
                  color: theme.text.primary,
                  cursor: "pointer",
                  fontSize: 11,
                  textAlign: "left",
                }}
              >
                <span>{row.building}</span>
                <span>{row.floor}</span>
                <span>{row.status}</span>
                <span>{row.contractor}</span>
                <span>{row.devices}</span>
              </button>
            ))}
          </>
        )}
      </WireBox>
    </Stack>
  );
}

function FirstVisitLeftPanel({ setState }: { setState: (patch: Partial<AppState>) => void }) {
  return (
    <Stack gap={10} style={{ padding: 12, overflow: "auto", height: "100%" }}>
      <Text size="small" tone="tertiary" style={{ fontSize: 10, textTransform: "uppercase" }}>
        Your org
      </Text>
      <Text weight="semibold">156 devices commissioned</Text>
      <Text size="small" tone="secondary">
        Cameras, doors, and sensors are live in Command — not yet placed on a floorplan.
      </Text>
      <Divider />
      <Text size="small" tone="tertiary" style={{ fontSize: 10, textTransform: "uppercase" }}>
        Quick links
      </Text>
      <PanelListRow label="Search devices" onClick={() => setState({ searchFocused: true })} />
      <PanelListRow label="Recent alerts" trailing="2" />
    </Stack>
  );
}

function getOrgSiteById(id: string): MockOrgSite | undefined {
  return ORG_SITES.find((s) => s.id === id);
}

function openDrawDevicesPanel(setState: (patch: Partial<AppState>) => void) {
  setState({ editorRightTab: "devices", stampActive: false });
}

function DrawDevicesList({
  siteIds,
  onPlaceDevice,
}: {
  siteIds: string[];
  onPlaceDevice: (device: MockUnplacedDevice) => void;
}) {
  const theme = useHostTheme();
  const activeSiteIds = siteIds.length > 0 ? siteIds : ORG_SITES.map((s) => s.id);
  const sites = ORG_SITES.filter((s) => activeSiteIds.includes(s.id));

  return (
    <Stack gap={12}>
      <Text size="small" tone="secondary">
        Commissioned devices not yet placed on this floor — grouped by site and device family.
      </Text>
      {sites.map((site) => {
        const siteDevices = UNPLACED_DEVICES.filter((d) => d.siteId === site.id);
        if (siteDevices.length === 0) return null;
        return (
          <Stack key={site.id} gap={8}>
            <Stack gap={2}>
              <Text size="small" weight="semibold">
                {site.name}
              </Text>
              <Text size="small" tone="tertiary" style={{ fontSize: 10 }}>
                {site.code}
              </Text>
            </Stack>
            {UNPLACED_DEVICE_FAMILIES.map((family) => {
              const familyDevices = siteDevices.filter((d) => d.family === family);
              if (familyDevices.length === 0) return null;
              return (
                <Stack key={family} gap={4}>
                  <Text size="small" tone="tertiary" style={{ fontSize: 10, textTransform: "uppercase" }}>
                    {family} ({familyDevices.length})
                  </Text>
                  {familyDevices.map((d) => (
                    <WireBox key={d.id} style={{ padding: 8 }}>
                      <Text size="small" weight="semibold">
                        {d.label}
                      </Text>
                      <Text size="small" tone="tertiary">
                        {d.model} · {d.family}
                      </Text>
                      <Button
                        variant="secondary"
                        style={{ marginTop: 6, fontSize: 10 }}
                        onClick={() => onPlaceDevice(d)}
                      >
                        Place on map
                      </Button>
                    </WireBox>
                  ))}
                </Stack>
              );
            })}
            <div style={{ height: 1, background: theme.stroke.tertiary, marginTop: 4 }} />
          </Stack>
        );
      })}
    </Stack>
  );
}

function EditorRightPanel({
  state,
  setState,
}: {
  state: AppState;
  setState: (patch: Partial<AppState>) => void;
}) {
  const theme = useHostTheme();
  const selectedMarker = MARKERS.find((m) => m.id === state.selectedMarkerId) ?? null;

  const selectTool = (tool: EditorTool) => {
    setState({
      editorTool: tool,
      editorRightTab: tool === "Select" ? "tools" : tool === "Camera" || tool === "Sensor" ? "devices" : "properties",
      stampActive: tool === "Camera" || tool === "Sensor",
      selectedMarkerId: tool === "Select" ? state.selectedMarkerId : null,
      showFovCones: tool === "Camera" && !!state.selectedMarkerId,
    });
  };

  const placeDevice = (device: MockUnplacedDevice) => {
    const tool: EditorTool = device.family === "Sensors" ? "Sensor" : "Camera";
    setState({
      editorTool: tool,
      editorRightTab: "devices",
      stampActive: true,
      selectedMarkerId: null,
    });
  };

  return (
    <Stack gap={0} style={{ height: "100%", overflow: "hidden" }}>
      <Row gap={0} style={{ borderBottom: `1px solid ${theme.stroke.tertiary}` }}>
        {(["tools", "devices", "properties"] as EditorRightTab[]).map((tab) => (
          <Button
            key={tab}
            variant={state.editorRightTab === tab ? "primary" : "ghost"}
            onClick={() => setState({ editorRightTab: tab })}
            style={{ fontSize: 10, textTransform: "capitalize", flex: 1 }}
          >
            {tab}
          </Button>
        ))}
      </Row>
      <Stack gap={10} style={{ padding: 12, overflow: "auto", flex: 1 }}>
        {state.editorRightTab === "tools" ? (
          <>
            <Button
              variant={state.editorTool === "Select" ? "primary" : "secondary"}
              onClick={() => selectTool("Select")}
              style={{ width: "100%", justifyContent: "flex-start" }}
            >
              Select
            </Button>
            {EDITOR_TOOL_GROUPS.map((group) => (
              <Stack key={group.label} gap={6}>
                <Text size="small" tone="tertiary" style={{ fontSize: 10, textTransform: "uppercase" }}>
                  {group.label}
                </Text>
                {group.tools.map((tool) => (
                  <Button
                    key={tool}
                    variant={state.editorTool === tool ? "primary" : "ghost"}
                    onClick={() => selectTool(tool)}
                    style={{ width: "100%", justifyContent: "flex-start", fontSize: 11 }}
                  >
                    {tool}
                  </Button>
                ))}
              </Stack>
            ))}
          </>
        ) : null}

        {state.editorRightTab === "devices" ? (
          <DrawDevicesList siteIds={state.selectedSiteIds ?? []} onPlaceDevice={placeDevice} />
        ) : null}

        {state.editorRightTab === "properties" ? (
          <>
            {selectedMarker ? (
              <>
                <Text weight="semibold">{selectedMarker.label}</Text>
                <Chip label={selectedMarker.model} />
                {state.showFovCones ? (
                  <>
                    <Text size="small" tone="tertiary" style={{ fontSize: 10, textTransform: "uppercase" }}>
                      FOV
                    </Text>
                    <Row justify="space-between">
                      <Text size="small" tone="secondary">
                        Bearing
                      </Text>
                      <Text size="small">127°</Text>
                    </Row>
                    <Row justify="space-between">
                      <Text size="small" tone="secondary">
                        Range
                      </Text>
                      <Text size="small">18 ft</Text>
                    </Row>
                    <Button variant="secondary">Reset to model default</Button>
                  </>
                ) : null}
                <Button variant="ghost">Delete marker</Button>
              </>
            ) : (
              <>
                <Text weight="semibold">{state.editorTool} properties</Text>
                {state.editorTool === "Wall" ? (
                  <>
                    <Row justify="space-between">
                      <Text size="small" tone="secondary">
                        Snap to grid
                      </Text>
                      <Text size="small">On</Text>
                    </Row>
                    <Row justify="space-between">
                      <Text size="small" tone="secondary">
                        Thickness
                      </Text>
                      <Text size="small">6 in</Text>
                    </Row>
                    <Text size="small" tone="secondary">
                      Click to add points. Double-click to finish segment.
                    </Text>
                  </>
                ) : null}
                {state.editorTool === "Door" ? (
                  <>
                    <Row justify="space-between">
                      <Text size="small" tone="secondary">
                        Width
                      </Text>
                      <Text size="small">36 in</Text>
                    </Row>
                    <Row justify="space-between">
                      <Text size="small" tone="secondary">
                        Swing
                      </Text>
                      <Text size="small">Left-in</Text>
                    </Row>
                  </>
                ) : null}
                {state.editorTool === "Cable" ? (
                  <Text size="small" tone="secondary">
                    Draw path between device endpoints. Autosnap highlights valid targets within 2m.
                  </Text>
                ) : null}
                {state.editorTool === "Ruler" ? (
                  <Row justify="space-between">
                    <Text size="small" tone="secondary">
                      Last measure
                    </Text>
                    <Text size="small">24 ft 6 in</Text>
                  </Row>
                ) : null}
                {state.editorTool === "Area" ? (
                  <>
                    <Row justify="space-between">
                      <Text size="small" tone="secondary">
                        Name
                      </Text>
                      <Text size="small">Lobby</Text>
                    </Row>
                    <Text size="small" tone="secondary">
                      Click vertices to define polygon. Esc to cancel.
                    </Text>
                  </>
                ) : null}
                {state.editorTool === "Label" ? (
                  <Text size="small" tone="secondary">
                    Click to place text annotation. Classify as room, entry, or exit.
                  </Text>
                ) : null}
                {state.editorTool === "Select" ? (
                  <Text size="small" tone="secondary">
                    Select a marker or structural element on the canvas to edit properties.
                  </Text>
                ) : null}
              </>
            )}
          </>
        ) : null}
      </Stack>
    </Stack>
  );
}

function EditorCanvasOverlays({ state }: { state: AppState }) {
  const theme = useHostTheme();
  if (!state.editorMode) return null;

  return (
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {state.editorTool === "Wall" || state.editorTool === "Door" ? (
        <>
          <polyline
            points="28%,38% 42%,38% 42%,52% 58%,52%"
            fill="none"
            stroke={theme.accent.primary}
            strokeWidth="2"
          />
          {state.editorTool === "Door" ? (
            <path d="M 42% 52% A 4% 4% 0 0 1 46% 48%" fill="none" stroke={theme.text.secondary} strokeWidth="1.5" />
          ) : null}
        </>
      ) : null}
      {state.editorTool === "Cable" ? (
        <polyline
          points="55%,35% 62%,45% 58%,68% 70%,72%"
          fill="none"
          stroke={theme.text.link}
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
      ) : null}
      {state.editorTool === "Ruler" ? (
        <>
          <line x1="30%" y1="60%" x2="48%" y2="60%" stroke={theme.text.secondary} strokeWidth="1.5" />
          <text x="39%" y="58%" fill={theme.text.tertiary} fontSize="10">
            24 ft
          </text>
        </>
      ) : null}
      {state.editorTool === "Area" ? (
        <polygon
          points="48%,30% 68%,30% 72%,48% 52%,55%"
          fill={theme.fill.tertiary}
          stroke={theme.accent.primary}
          strokeWidth="1.5"
          opacity="0.5"
        />
      ) : null}
      {state.showFovCones && state.selectedMarkerId === "cam-lobby-01" ? (
        <polygon points="55%,35% 62%,28% 68%,42%" fill={theme.accent.primary} opacity="0.15" stroke={theme.accent.primary} />
      ) : null}
      {state.stampActive ? (
        <text x="50%" y="50%" fill={theme.text.tertiary} fontSize="11" textAnchor="middle">
          Click to place {state.editorTool.toLowerCase()}
        </text>
      ) : null}
    </svg>
  );
}

function LeftPanelContent({
  state,
  setState,
}: {
  state: AppState;
  setState: (patch: Partial<AppState>) => void;
}) {
  const theme = useHostTheme();
  const selectedPlace = LOCATIONS.find((l) => l.id === state.selectedPlaceId) ?? null;

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
      });
    },
    [setState],
  );

  if (state.searchFocused) {
    const q = state.searchQuery.toLowerCase();
    const matchedPlaces = q ? LOCATIONS.filter((l) => l.label.toLowerCase().includes(q)) : [];
    const matchedDevices = q ? MARKERS.filter((m) => m.label.toLowerCase().includes(q)) : [];
    return (
      <Stack gap={0} style={{ height: "100%", overflow: "auto" }}>
        {!q ? (
          <>
            <Text size="small" tone="tertiary" style={{ padding: "8px 12px", fontSize: 10, textTransform: "uppercase" }}>
              Recent
            </Text>
            {LOCATIONS.slice(0, 2).map((loc) => (
              <PanelListRow key={loc.id} label={loc.label} onClick={() => goToPlace(loc)} />
            ))}
            <Divider />
            <Text size="small" tone="tertiary" style={{ padding: "8px 12px", fontSize: 10, textTransform: "uppercase" }}>
              Places
            </Text>
            {LOCATIONS.slice(2).map((loc) => (
              <PanelListRow key={loc.id} label={`${loc.label} · ${loc.kind}`} onClick={() => goToPlace(loc)} />
            ))}
            <Divider />
            <Text size="small" tone="tertiary" style={{ padding: "8px 12px", fontSize: 10, textTransform: "uppercase" }}>
              Devices
            </Text>
            {MARKERS.slice(0, 2).map((m) => (
              <PanelListRow key={m.id} label={`${m.label} · ${m.kind}`} />
            ))}
          </>
        ) : matchedPlaces.length === 0 && matchedDevices.length === 0 ? (
          <Text size="small" tone="secondary" style={{ padding: 12 }}>
            No results for &quot;{state.searchQuery}&quot;
          </Text>
        ) : (
          <>
            {matchedPlaces.length > 0 ? (
              <>
                <Text size="small" tone="tertiary" style={{ padding: "8px 12px", fontSize: 10, textTransform: "uppercase" }}>
                  Places
                </Text>
                {matchedPlaces.map((loc) => (
                  <PanelListRow key={loc.id} label={loc.label} onClick={() => goToPlace(loc)} />
                ))}
              </>
            ) : null}
            {matchedDevices.length > 0 ? (
              <>
                <Text size="small" tone="tertiary" style={{ padding: "8px 12px", fontSize: 10, textTransform: "uppercase" }}>
                  Devices
                </Text>
                {matchedDevices.map((m) => (
                  <PanelListRow key={m.id} label={m.label} trailing={m.kind} />
                ))}
              </>
            ) : null}
          </>
        )}
      </Stack>
    );
  }

  if (
    !state.orgHasFloorplans &&
    !state.editorMode &&
    state.rail === "map" &&
    !state.searchFocused &&
    !state.selectedPlaceId
  ) {
    return <FirstVisitLeftPanel setState={setState} />;
  }

  if (state.editorMode && !state.searchFocused) {
    const place = selectedPlace ?? LOCATIONS.find((l) => l.id === "floor-3")!;
    return (
      <Stack gap={8} style={{ padding: 12, overflow: "auto", height: "100%" }}>
        <Text size="small" tone="tertiary">
          Org › HQ Campus › Main Bldg › {place.label}
        </Text>
        <Text weight="semibold">{place.label}</Text>
        <Chip label="Editing" tone="accent" />
        <Divider />
        <Text size="small" tone="tertiary" style={{ fontSize: 10, textTransform: "uppercase" }}>
          On this floor
        </Text>
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
        <Divider />
        <Text size="small" tone="tertiary" style={{ fontSize: 10, textTransform: "uppercase" }}>
          Unplaced ({UNPLACED_DEVICES.length})
        </Text>
        {UNPLACED_DEVICES.slice(0, 2).map((d) => {
          const site = getOrgSiteById(d.siteId);
          return (
            <Text key={d.id} size="small" tone="secondary">
              {d.label} · {site?.code ?? d.siteId}
            </Text>
          );
        })}
        <Button variant="secondary" onClick={() => openDrawDevicesPanel(setState)}>
          Draw Devices
        </Button>
      </Stack>
    );
  }

  if (selectedPlace) {
    const breadcrumb =
      selectedPlace.kind === "floor"
        ? "Org › HQ Campus › Main Bldg"
        : selectedPlace.kind === "building"
          ? "Org › HQ Campus"
          : "Org";
    return (
      <Stack gap={0} style={{ height: "100%", overflow: "hidden" }}>
        <Stack gap={8} style={{ padding: 12, borderBottom: `1px solid ${theme.stroke.tertiary}` }}>
          <Button variant="ghost" onClick={() => setState({ selectedPlaceId: null })}>
            {breadcrumb}
          </Button>
          <Text weight="semibold">{selectedPlace.label}</Text>
          <Row gap={6} wrap>
            <Chip label={selectedPlace.kind} tone="accent" />
            <Chip label={selectedPlace.site} />
            <Chip
              label={`${selectedPlace.online}/${selectedPlace.total} online`}
              tone={selectedPlace.online === selectedPlace.total ? "success" : "warning"}
            />
          </Row>
          <Row gap={6} wrap>
            <Button
              variant="primary"
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
            </Button>
            {["Add to Collection", "Share", "Permissions", "Nearby"].map((a) => (
              <Button key={a} variant="secondary">
                {a}
              </Button>
            ))}
          </Row>
        </Stack>
        <Row gap={0} style={{ borderBottom: `1px solid ${theme.stroke.tertiary}` }}>
          {PLACE_TABS.map((t) => (
            <Button
              key={t}
              variant={state.placeTab === t ? "primary" : "ghost"}
              onClick={() => setState({ placeTab: t })}
              style={{ fontSize: 10, textTransform: "capitalize" }}
            >
              {t}
            </Button>
          ))}
        </Row>
        <Stack gap={8} style={{ padding: 12, overflow: "auto", flex: 1 }}>
          {state.placeTab === "overview" ? (
            <>
              <Text size="small" tone="tertiary" style={{ fontSize: 10, textTransform: "uppercase" }}>
                Marker counts
              </Text>
              {[
                ["Cameras", "24"],
                ["Doors", "12"],
                ["Sensors", "6"],
              ].map(([l, n]) => (
                <Row key={l} justify="space-between">
                  <Text size="small" tone="secondary">
                    {l}
                  </Text>
                  <Text size="small">{n}</Text>
                </Row>
              ))}
              <Divider />
              <Text size="small" tone="tertiary" style={{ fontSize: 10, textTransform: "uppercase" }}>
                Linked files
              </Text>
              <Text size="small" tone="secondary">
                Floor-3-Layout-v2.pdf · Jan 14
              </Text>
              {!state.filesFlyoutOpen ? (
                <Text size="small" tone="tertiary">
                  Drag a floorplan onto the map, or open Files to upload.
                </Text>
              ) : null}
            </>
          ) : null}
          {state.placeTab === "markers"
            ? MARKERS.map((m) => (
                <PanelListRow
                  key={m.id}
                  label={m.label}
                  trailing={m.kind}
                  onClick={() =>
                    setState({ editorMode: true, editorTool: "Select", selectedMarkerId: m.id })
                  }
                />
              ))
            : null}
          {state.placeTab === "activity"
            ? [
                "Motion detected · Cam-NE-01 · 2m ago",
                "Door propped · Door-007 · 14m ago",
                "Cam-SW-04 went offline · 1h ago",
                "Marker placed on Floor 3 · 3h ago",
              ].map((e) => (
                <Text key={e} size="small" tone="secondary">
                  {e}
                </Text>
              ))
            : null}
          {state.placeTab === "about"
            ? [
                ["Site", selectedPlace.site],
                ["Kind", selectedPlace.kind],
                ["Parent", selectedPlace.kind === "floor" ? "Main Building" : "HQ Campus"],
                ["Online", `${selectedPlace.online} / ${selectedPlace.total}`],
              ].map(([k, v]) => (
                <Row key={k} justify="space-between">
                  <Text size="small" tone="secondary">
                    {k}
                  </Text>
                  <Text size="small">{v}</Text>
                </Row>
              ))
            : null}
        </Stack>
      </Stack>
    );
  }

  if (state.rail === "locations") {
    if (!state.orgHasFloorplans) {
      return (
        <Stack gap={8} style={{ padding: 12, overflow: "auto" }}>
          <Text weight="semibold">All Locations</Text>
          <Text size="small" tone="secondary">
            Upload a floorplan to create your first building and floor. Devices will appear here once placed.
          </Text>
          <Button variant="secondary" onClick={() => setState({ filesFlyoutOpen: true })}>
            Upload floorplan
          </Button>
        </Stack>
      );
    }
    return (
      <Stack gap={0} style={{ padding: 8, overflow: "auto" }}>
        <Text size="small" tone="tertiary" style={{ padding: "4px 8px", fontSize: 10, textTransform: "uppercase" }}>
          All Locations
        </Text>
        {LOCATIONS.map((loc) => (
          <PanelListRow
            key={loc.id}
            label={loc.label}
            depth={loc.depth}
            trailing={`${loc.online}/${loc.total}`}
            onClick={() => goToPlace(loc)}
          />
        ))}
      </Stack>
    );
  }

  if (state.rail === "collections") {
    const filtered =
      state.collTab === "mine"
        ? COLLECTIONS.filter((c) => c.owned)
        : state.collTab === "shared"
          ? COLLECTIONS.filter((c) => c.shared)
          : [];
    return (
      <Stack gap={8} style={{ padding: 12, overflow: "auto" }}>
        <Text weight="semibold">Collections</Text>
        <Row gap={6} wrap>
          {(["mine", "shared", "following"] as CollTab[]).map((f) => (
            <Pill key={f} active={state.collTab === f} onClick={() => setState({ collTab: f })} size="sm">
              {f === "mine" ? "My Collections" : f === "shared" ? "Shared with me" : "Following"}
            </Pill>
          ))}
        </Row>
        {filtered.map((col) => (
          <Stack key={col.id} gap={4}>
            <Button
              variant="ghost"
              onClick={() =>
                setState({
                  expandedCollectionId: state.expandedCollectionId === col.id ? null : col.id,
                })
              }
            >
              {col.label} ({col.count})
            </Button>
            {state.expandedCollectionId === col.id
              ? Array.from({ length: Math.min(3, col.count) }, (_, i) => (
                  <Text key={i} size="small" tone="secondary" style={{ paddingLeft: 12 }}>
                    Camera {i + 1} · Online
                  </Text>
                ))
              : null}
          </Stack>
        ))}
      </Stack>
    );
  }

  if (state.rail === "layers") {
    return (
      <Stack gap={12} style={{ padding: 12, overflow: "auto" }}>
        <Text weight="semibold">Data Layers</Text>
        {Object.entries(LAYER_GROUPS).map(([group, layers]) => (
          <Stack key={group} gap={4}>
            <Text size="small" tone="tertiary" style={{ fontSize: 10, textTransform: "uppercase" }}>
              {group}
            </Text>
            {layers.map((layer) => {
              const active = state.activeLayers.includes(layer);
              return (
                <Button
                  key={layer}
                  variant={active ? "primary" : "ghost"}
                  onClick={() => {
                    const next = active
                      ? state.activeLayers.filter((l) => l !== layer)
                      : [...state.activeLayers, layer];
                    setState({ activeLayers: next });
                  }}
                  style={{ justifyContent: "flex-start", width: "100%" }}
                >
                  {active ? "[x]" : "[ ]"} {layer}
                </Button>
              );
            })}
          </Stack>
        ))}
      </Stack>
    );
  }

  if (state.rail === "recents") {
    if (!state.orgHasFloorplans) {
      return (
        <Stack gap={8} style={{ padding: 12, overflow: "auto" }}>
          <Text weight="semibold">Recently Viewed</Text>
          <Text size="small" tone="secondary">
            Places you open will appear here after your first building exists.
          </Text>
        </Stack>
      );
    }
    return (
      <Stack gap={0} style={{ padding: 12, overflow: "auto" }}>
        <Text weight="semibold">Recently Viewed</Text>
        {LOCATIONS.map((loc) => (
          <PanelListRow key={loc.id} label={loc.label} onClick={() => goToPlace(loc)} />
        ))}
      </Stack>
    );
  }

  return (
    <Stack gap={8} style={{ padding: 12, overflow: "auto" }}>
      <Text size="small" tone="tertiary" style={{ fontSize: 10, textTransform: "uppercase" }}>
        Active alerts
      </Text>
      <Callout tone="warning" title="No active emergencies">
        Showing alerts scoped to HQ-MAIN.
      </Callout>
      {[
        "Door forced open · HQ › Floor 2 › Lobby · 3 min",
        "After-hours motion · Warehouse A › Dock 4 · 17 min",
      ].map((e) => (
        <Text key={e} size="small" tone="secondary">
          {e}
        </Text>
      ))}
      <Divider />
      <Text size="small" tone="tertiary" style={{ fontSize: 10, textTransform: "uppercase" }}>
        Recents
      </Text>
      {LOCATIONS.slice(0, 3).map((loc) => (
        <PanelListRow key={loc.id} label={loc.label} onClick={() => goToPlace(loc)} />
      ))}
    </Stack>
  );
}

const GLOBE_STARS: [number, number][] = [
  [12, 8],
  [28, 15],
  [74, 11],
  [88, 22],
  [15, 78],
  [82, 68],
  [45, 10],
  [62, 85],
  [8, 42],
  [91, 48],
  [33, 72],
  [70, 32],
];

function GlobeBackdrop({ pin }: { pin?: { x: number; y: number; visible: boolean } }) {
  const theme = useHostTheme();
  return (
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }} aria-hidden>
      <rect width="100%" height="100%" fill={theme.bg.editor} />
      {GLOBE_STARS.map(([x, y], i) => (
        <circle key={i} cx={`${x}%`} cy={`${y}%`} r="1" fill={theme.text.quaternary} opacity="0.55" />
      ))}
      <circle cx="50%" cy="54%" r="36%" fill="none" stroke={theme.accent.primary} strokeWidth="12" opacity="0.06" />
      <circle cx="50%" cy="54%" r="33%" fill="none" stroke={theme.text.link} strokeWidth="4" opacity="0.12" />
      <circle cx="50%" cy="54%" r="30%" fill={theme.text.link} opacity="0.28" />
      <ellipse cx="58%" cy="54%" rx="18%" ry="28%" fill={theme.bg.editor} opacity="0.45" />
      <ellipse cx="38%" cy="46%" rx="9%" ry="14%" fill={theme.fill.secondary} opacity="0.55" />
      <ellipse cx="52%" cy="58%" rx="7%" ry="10%" fill={theme.fill.secondary} opacity="0.45" />
      <ellipse cx="46%" cy="38%" rx="5%" ry="7%" fill={theme.fill.secondary} opacity="0.4" />
      {pin?.visible ? (
        <>
          <circle cx={`${pin.x}%`} cy={`${pin.y}%`} r="14" fill={theme.accent.primary} opacity="0.15" />
          <circle cx={`${pin.x}%`} cy={`${pin.y}%`} r="4" fill={theme.accent.primary} />
        </>
      ) : null}
    </svg>
  );
}

function UploadCheckIcon() {
  const theme = useHostTheme();
  return (
    <div
      style={{
        width: 20,
        height: 20,
        borderRadius: 999,
        background: theme.text.link,
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
      }}
    >
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
        <path d="M2 5 L4 7 L8 3" stroke={theme.text.onAccent} strokeWidth="1.5" fill="none" />
      </svg>
    </div>
  );
}

function FloorplanThumbnail() {
  const theme = useHostTheme();
  return (
    <WireBox style={{ width: 44, height: 44, padding: 0, overflow: "hidden", flexShrink: 0, borderRadius: 4 }}>
      <svg width="44" height="44" aria-hidden>
        <rect width="44" height="44" fill={theme.fill.quaternary} />
        <rect x="8" y="10" width="28" height="24" fill="none" stroke={theme.stroke.secondary} strokeWidth="1" />
        <rect x="14" y="16" width="10" height="8" fill="none" stroke={theme.stroke.tertiary} strokeWidth="0.75" />
        <rect x="26" y="20" width="6" height="10" fill="none" stroke={theme.stroke.tertiary} strokeWidth="0.75" />
      </svg>
    </WireBox>
  );
}

function UploadedFileTile({
  file,
  onRemove,
  onSetLocation,
}: {
  file: MockUploadedFile;
  onRemove: () => void;
  onSetLocation: () => void;
}) {
  const theme = useHostTheme();
  const hasLocation = !!file.locationAddress;

  return (
    <Row
      align="center"
      gap={8}
      style={{
        padding: "10px 4px",
        borderTop: `1px solid ${theme.stroke.tertiary}`,
        width: "100%",
      }}
    >
      <UploadCheckIcon />
      <FloorplanThumbnail />
      <Text size="small" weight="semibold" style={{ flex: 1, minWidth: 0, textAlign: "left" }} truncate>
        {file.fileName}
      </Text>
      {hasLocation ? (
        <Chip label={file.locationAddress!.split(",")[0]} tone="success" />
      ) : (
        <Button
          variant="secondary"
          onClick={(e) => {
            e.stopPropagation();
            onSetLocation();
          }}
          style={{ fontSize: 10, padding: "4px 8px", whiteSpace: "nowrap" }}
        >
          Set location
        </Button>
      )}
      <Button
        variant="ghost"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        style={{ fontSize: 12, padding: "2px 8px", minWidth: 0 }}
        title="Remove file"
      >
        x
      </Button>
    </Row>
  );
}

function FirstVisitUploadCard({
  uploadedFiles,
  onUploadFile,
  onRemoveFile,
  onSetLocation,
}: {
  uploadedFiles: MockUploadedFile[];
  onUploadFile: () => void;
  onRemoveFile: (id: string) => void;
  onSetLocation: (id: string) => void;
}) {
  const theme = useHostTheme();
  const [dropHover, setDropHover] = useState(false);
  const hasFiles = uploadedFiles.length > 0;

  return (
    <Card
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 480,
        maxWidth: "92%",
        zIndex: 15,
      }}
    >
      <CardBody style={{ padding: 24 }}>
        <Stack gap={14} style={{ textAlign: "center" }}>
          <Stack gap={4}>
            <Text weight="semibold" style={{ fontSize: 16 }}>
              Welcome to Maps
            </Text>
            <Text size="small" tone="secondary">
              See where every Verkada device lives in the real world. Upload a floorplan to get started.
            </Text>
          </Stack>

          <Stack gap={8} style={{ textAlign: "left", width: "100%" }}>
            <Text size="small" tone="tertiary" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Add your files
            </Text>
            <WireBox style={{ padding: 0, overflow: "hidden" }}>
              <div
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onUploadFile();
                }}
                onMouseEnter={() => setDropHover(true)}
                onMouseLeave={() => setDropHover(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") onUploadFile();
                }}
                style={{
                  padding: hasFiles ? "20px 16px" : "36px 20px",
                  borderBottom: hasFiles ? `1px solid ${theme.stroke.tertiary}` : "none",
                  border: hasFiles ? "none" : `2px dashed ${dropHover ? theme.accent.primary : theme.stroke.secondary}`,
                  borderRadius: hasFiles ? 0 : 8,
                  background: dropHover ? theme.fill.tertiary : theme.fill.quaternary,
                  cursor: "pointer",
                  textAlign: "center",
                }}
              >
                <Stack gap={6} style={{ alignItems: "center" }}>
                  <Text weight="semibold">Drop floorplan here</Text>
                  <Text size="small" tone="secondary">
                    PDF, PNG, or JPG
                  </Text>
                  {!hasFiles ? (
                    <Button
                      variant="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUploadFile();
                      }}
                    >
                      Browse files
                    </Button>
                  ) : (
                    <Text size="small" tone="tertiary">
                      Drop to add another floorplan
                    </Text>
                  )}
                </Stack>
              </div>
              {hasFiles ? (
                <div style={{ padding: "0 12px 8px" }}>
                  {uploadedFiles.map((file) => (
                    <UploadedFileTile
                      key={file.id}
                      file={file}
                      onRemove={() => onRemoveFile(file.id)}
                      onSetLocation={() => onSetLocation(file.id)}
                    />
                  ))}
                </div>
              ) : null}
            </WireBox>
          </Stack>
        </Stack>
      </CardBody>
    </Card>
  );
}

function WorldMapBackdrop() {
  const theme = useHostTheme();

  // Simplified continental US + AK + HI for a Mapbox-style country reference (zoom ~4).
  const continentalUs =
    "M 118,58 L 168,52 L 228,48 L 298,46 L 368,48 L 428,54 L 478,64 L 512,82 L 532,108 " +
    "L 542,138 L 544,172 L 536,206 L 518,238 L 492,264 L 458,284 L 418,298 L 372,308 L 322,314 " +
    "L 272,316 L 222,314 L 172,308 L 128,296 L 98,276 L 82,248 L 74,216 L 72,182 L 78,148 L 92,118 L 108,92 Z";
  const florida =
    "M 458,284 L 472,302 L 488,318 L 502,332 L 494,342 L 478,338 L 464,320 L 456,298 Z";
  const alaska =
    "M 28,38 L 52,32 L 78,36 L 92,48 L 88,62 L 68,68 L 44,64 L 30,52 Z";
  const hawaii: [number, number][] = [
    [198, 328],
    [208, 332],
    [218, 330],
    [228, 334],
  ];

  return (
    <>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 640 420"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: "absolute", inset: 0 }}
        aria-hidden
      >
        {/* Ocean */}
        <rect width="640" height="420" fill={theme.fill.secondary} />

        {/* Subtle graticule */}
        <defs>
          <pattern id="usaGraticule" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke={theme.stroke.tertiary} strokeWidth="0.35" opacity="0.5" />
          </pattern>
        </defs>
        <rect width="640" height="420" fill="url(#usaGraticule)" opacity="0.35" />

        {/* Land masses */}
        <path d={continentalUs} fill={theme.fill.tertiary} stroke={theme.stroke.secondary} strokeWidth="1.2" />
        <path d={florida} fill={theme.fill.tertiary} stroke={theme.stroke.secondary} strokeWidth="1" />
        <path d={alaska} fill={theme.fill.tertiary} stroke={theme.stroke.secondary} strokeWidth="1" />
        {hawaii.map(([cx, cy], i) => (
          <circle key={`hi-${i}`} cx={cx} cy={cy} r="4" fill={theme.fill.tertiary} stroke={theme.stroke.secondary} strokeWidth="0.8" />
        ))}

        {/* Faint state / region hints */}
        <line x1="280" y1="46" x2="272" y2="316" stroke={theme.stroke.tertiary} strokeWidth="0.6" opacity="0.45" />
        <line x1="368" y1="48" x2="358" y2="310" stroke={theme.stroke.tertiary} strokeWidth="0.6" opacity="0.45" />
        <line x1="118" y1="140" x2="544" y2="140" stroke={theme.stroke.tertiary} strokeWidth="0.6" opacity="0.35" />
        <line x1="108" y1="220" x2="536" y2="220" stroke={theme.stroke.tertiary} strokeWidth="0.6" opacity="0.35" />

        <text x="320" y="200" fontSize="11" fill={theme.text.tertiary} fontFamily="system-ui, sans-serif" textAnchor="middle" opacity="0.35">
          United States
        </text>

        <text x="630" y="414" fontSize="8" fill={theme.text.tertiary} fontFamily="monospace" textAnchor="end">
          © Mapbox · zoom 4 · United States
        </text>
      </svg>
    </>
  );
}

function ZoomedStreetMapBackdrop({
  address,
}: {
  buildingOutline: string;
  center: { x: number; y: number };
  address?: string;
}) {
  const theme = useHostTheme();

  // L-shaped building polygon (corner building, NW of intersection)
  // Vertex points in the 640×420 SVG coordinate space
  const bldgPoints = "178,118 296,118 296,140 296,254 248,254 248,195 178,195";

  const displayAddress = address || "500 Howard St, San Francisco, CA";
  // Truncate long addresses for the bubble
  const bubbleLabel = displayAddress.length > 32
    ? displayAddress.slice(0, 30) + "…"
    : displayAddress;

  return (
    <>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 640 420"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: "absolute", inset: 0 }}
        aria-hidden
      >
        {/* ── Map background (Mapbox light style) ── */}
        <rect width="640" height="420" fill={theme.fill.secondary} />

        {/* ── Streets ── */}
        {/* Howard St — vertical, slightly right of center */}
        <rect x="306" y="0" width="22" height="420" fill={theme.bg.editor} />
        {/* Mission St — horizontal */}
        <rect x="0" y="262" width="640" height="20" fill={theme.bg.editor} />

        {/* ── NW Block — parcels left of Howard, above Mission ── */}
        {/* Row closest to Howard St */}
        <rect x="248" y="22" width="52" height="66" rx="1" fill={theme.fill.tertiary} />
        <rect x="196" y="24" width="46" height="64" rx="1" fill={theme.fill.tertiary} />
        <rect x="144" y="26" width="46" height="62" rx="1" fill={theme.fill.tertiary} />
        <rect x="90" y="28" width="48" height="60" rx="1" fill={theme.fill.tertiary} />
        <rect x="28" y="28" width="56" height="60" rx="1" fill={theme.fill.tertiary} />
        {/* Second row */}
        <rect x="248" y="96" width="52" height="56" rx="1" fill={theme.fill.tertiary} />
        <rect x="198" y="94" width="44" height="54" rx="1" fill={theme.fill.tertiary} />
        <rect x="148" y="96" width="44" height="52" rx="1" fill={theme.fill.tertiary} />
        <rect x="94" y="94" width="48" height="54" rx="1" fill={theme.fill.tertiary} />
        <rect x="28" y="96" width="60" height="52" rx="1" fill={theme.fill.tertiary} />
        {/* Third row, near Mission */}
        <rect x="248" y="200" width="52" height="56" rx="1" fill={theme.fill.tertiary} />
        <rect x="198" y="200" width="44" height="56" rx="1" fill={theme.fill.tertiary} />
        <rect x="148" y="198" width="44" height="58" rx="1" fill={theme.fill.tertiary} />
        <rect x="92" y="200" width="50" height="56" rx="1" fill={theme.fill.tertiary} />
        <rect x="28" y="198" width="58" height="58" rx="1" fill={theme.fill.tertiary} />

        {/* ── NE Block — parcels right of Howard, above Mission ── */}
        <rect x="334" y="22" width="52" height="66" rx="1" fill={theme.fill.tertiary} />
        <rect x="392" y="24" width="50" height="64" rx="1" fill={theme.fill.tertiary} />
        <rect x="448" y="26" width="48" height="62" rx="1" fill={theme.fill.tertiary} />
        <rect x="502" y="28" width="46" height="60" rx="1" fill={theme.fill.tertiary} />
        <rect x="554" y="28" width="82" height="60" rx="1" fill={theme.fill.tertiary} />
        <rect x="334" y="96" width="52" height="56" rx="1" fill={theme.fill.tertiary} />
        <rect x="392" y="94" width="50" height="58" rx="1" fill={theme.fill.tertiary} />
        <rect x="448" y="96" width="48" height="56" rx="1" fill={theme.fill.tertiary} />
        <rect x="502" y="94" width="46" height="58" rx="1" fill={theme.fill.tertiary} />
        <rect x="554" y="96" width="82" height="56" rx="1" fill={theme.fill.tertiary} />
        <rect x="334" y="200" width="52" height="56" rx="1" fill={theme.fill.tertiary} />
        <rect x="392" y="198" width="50" height="58" rx="1" fill={theme.fill.tertiary} />
        <rect x="448" y="200" width="48" height="56" rx="1" fill={theme.fill.tertiary} />
        <rect x="502" y="200" width="46" height="56" rx="1" fill={theme.fill.tertiary} />
        <rect x="554" y="200" width="82" height="56" rx="1" fill={theme.fill.tertiary} />

        {/* ── SW Block — below Mission, left of Howard ── */}
        <rect x="248" y="288" width="52" height="62" rx="1" fill={theme.fill.tertiary} />
        <rect x="196" y="290" width="46" height="60" rx="1" fill={theme.fill.tertiary} />
        <rect x="144" y="288" width="46" height="62" rx="1" fill={theme.fill.tertiary} />
        <rect x="90" y="290" width="48" height="60" rx="1" fill={theme.fill.tertiary} />
        <rect x="28" y="290" width="56" height="60" rx="1" fill={theme.fill.tertiary} />
        <rect x="248" y="358" width="52" height="58" rx="1" fill={theme.fill.tertiary} />
        <rect x="196" y="356" width="46" height="60" rx="1" fill={theme.fill.tertiary} />
        <rect x="144" y="358" width="46" height="58" rx="1" fill={theme.fill.tertiary} />
        <rect x="90" y="358" width="48" height="58" rx="1" fill={theme.fill.tertiary} />
        <rect x="28" y="356" width="56" height="60" rx="1" fill={theme.fill.tertiary} />

        {/* ── SE Block — below Mission, right of Howard ── */}
        <rect x="334" y="288" width="52" height="62" rx="1" fill={theme.fill.tertiary} />
        <rect x="392" y="290" width="50" height="60" rx="1" fill={theme.fill.tertiary} />
        <rect x="448" y="288" width="48" height="62" rx="1" fill={theme.fill.tertiary} />
        <rect x="502" y="290" width="46" height="60" rx="1" fill={theme.fill.tertiary} />
        <rect x="554" y="290" width="82" height="60" rx="1" fill={theme.fill.tertiary} />
        <rect x="334" y="358" width="52" height="58" rx="1" fill={theme.fill.tertiary} />
        <rect x="392" y="356" width="50" height="60" rx="1" fill={theme.fill.tertiary} />
        <rect x="448" y="358" width="48" height="58" rx="1" fill={theme.fill.tertiary} />
        <rect x="502" y="356" width="46" height="60" rx="1" fill={theme.fill.tertiary} />
        <rect x="554" y="356" width="82" height="60" rx="1" fill={theme.fill.tertiary} />

        {/* ── Selected / confirmed building (L-shape, NW of intersection) ── */}
        <polygon
          points={bldgPoints}
          fill={theme.accent.primary}
          fillOpacity="0.08"
          stroke={theme.accent.primary}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* ── Address label bubble (right of building) ── */}
        <rect x="310" y="174" width={Math.max(120, bubbleLabel.length * 7 + 20)} height="26"
          rx="4" fill={theme.bg.editor} stroke={theme.stroke.secondary} strokeWidth="1" />
        <text x="320" y="192" fontSize="11" fontWeight="600"
          fill={theme.accent.primary} fontFamily="system-ui, -apple-system, sans-serif">
          {bubbleLabel}
        </text>

        {/* ── Street name labels ── */}
        <text x="317" y="140" fontSize="9" fill={theme.text.tertiary}
          fontFamily="system-ui, sans-serif"
          transform="rotate(90, 317, 140)" textAnchor="middle">
          Howard St
        </text>
        <text x="317" y="350" fontSize="9" fill={theme.text.tertiary}
          fontFamily="system-ui, sans-serif"
          transform="rotate(90, 317, 350)" textAnchor="middle">
          Howard St
        </text>
        <text x="150" y="275" fontSize="9" fill={theme.text.tertiary}
          fontFamily="system-ui, sans-serif" textAnchor="middle">
          Mission St
        </text>
        <text x="490" y="275" fontSize="9" fill={theme.text.tertiary}
          fontFamily="system-ui, sans-serif" textAnchor="middle">
          Mission St
        </text>

        {/* ── Parcel address numbers on a few nearby parcels ── */}
        <text x="274" y="58" fontSize="8" fill={theme.text.tertiary} fontFamily="system-ui" textAnchor="middle">500</text>
        <text x="219" y="58" fontSize="8" fill={theme.text.tertiary} fontFamily="system-ui" textAnchor="middle">506</text>
        <text x="167" y="60" fontSize="8" fill={theme.text.tertiary} fontFamily="system-ui" textAnchor="middle">512</text>
        <text x="360" y="58" fontSize="8" fill={theme.text.tertiary} fontFamily="system-ui" textAnchor="middle">501</text>
        <text x="417" y="58" fontSize="8" fill={theme.text.tertiary} fontFamily="system-ui" textAnchor="middle">507</text>
        <text x="472" y="60" fontSize="8" fill={theme.text.tertiary} fontFamily="system-ui" textAnchor="middle">513</text>

        {/* ── Map attribution ── */}
        <text x="630" y="414" fontSize="8" fill={theme.text.tertiary}
          fontFamily="monospace" textAnchor="end">
          © Mapbox · zoom 17
        </text>
      </svg>
    </>
  );
}

type LocationFlowStep = "search" | "align" | "select-sites";

const LOCATION_FLOW_STEP_TOTAL = 3;

const LOCATION_FLOW_STEPS: Record<
  LocationFlowStep,
  { num: number; title: string; hint: string }
> = {
  search: { num: 1, title: "Set address", hint: "" },
  align: { num: 2, title: "Align to building", hint: "Match your floorplan to the footprint" },
  "select-sites": {
    num: 3,
    title: "Select sites",
    hint: "Choose at least one site to link devices from",
  },
};

function LocationFlowSidePanel({
  step,
  onBack,
  children,
}: {
  step: LocationFlowStep;
  fileName: string;
  onBack?: () => void;
  children: React.ReactNode;
}) {
  const theme = useHostTheme();
  const meta = LOCATION_FLOW_STEPS[step];

  return (
    <WireBox
      style={{
        position: "absolute",
        top: 12,
        left: 12,
        width: 300,
        maxHeight: "calc(100% - 24px)",
        zIndex: 20,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        padding: 0,
      }}
    >
      <Stack
        gap={6}
        style={{
          padding: "12px 12px 10px",
          borderBottom: `1px solid ${theme.stroke.tertiary}`,
          flexShrink: 0,
        }}
      >
        <Row gap={8} align="center">
          {onBack ? (
            <Button variant="ghost" onClick={onBack} style={{ fontSize: 11, padding: "2px 6px", flexShrink: 0 }}>
              Back
            </Button>
          ) : null}
        </Row>
        <Text size="small" tone="tertiary" style={{ fontSize: 10, textTransform: "uppercase" }}>
          Step {meta.num} of {LOCATION_FLOW_STEP_TOTAL}
        </Text>
        <Text size="small" weight="semibold">
          {meta.title}
        </Text>
        {meta.hint ? (
          <Text size="small" tone="secondary">
            {meta.hint}
          </Text>
        ) : null}
      </Stack>
      <div style={{ overflow: "auto", flex: 1 }}>{children}</div>
    </WireBox>
  );
}

function LocationSearchStepContent({
  query,
  searchFocused,
  locationPinned,
  onFocus,
  onChange,
  onSelectSuggestion,
  onSubmitTyped,
  onContinueToAlign,
}: {
  query: string;
  searchFocused: boolean;
  locationPinned: boolean;
  onFocus: () => void;
  onChange: (value: string) => void;
  onSelectSuggestion: (suggestion: VerkadaAddressSuggestion) => void;
  onSubmitTyped: () => void;
  onContinueToAlign: () => void;
}) {
  const theme = useHostTheme();
  const suggestions = filterAddressSuggestions(query);
  const grouped = (["Site", "Camera", "Alarms area", "Access door"] as VerkadaAddressSource[]).map((source) => ({
    source,
    items: suggestions.filter((s) => s.source === source),
  }));

  return (
    <Stack gap={0}>
      <div
        style={{ padding: "10px 12px", borderBottom: `1px solid ${theme.stroke.tertiary}` }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && query.trim()) {
            e.preventDefault();
            onSubmitTyped();
          }
        }}
      >
        <TextInput
          value={query}
          onChange={onChange}
          onFocus={onFocus}
          placeholder="Search address…"
          type="search"
          style={{ width: "100%" }}
        />
      </div>
      {searchFocused ? (
        <Stack gap={0} style={{ maxHeight: 220, overflow: "auto" }}>
          <Text size="small" tone="tertiary" style={{ padding: "8px 12px 4px", fontSize: 10, textTransform: "uppercase" }}>
            From your Verkada org
          </Text>
          {grouped.map(({ source, items }) =>
            items.length > 0 ? (
              <Stack key={source} gap={0}>
                <Text size="small" tone="tertiary" style={{ padding: "6px 12px 2px", fontSize: 10 }}>
                  {source}
                </Text>
                {items.map((s) => (
                  <PanelListRow
                    key={s.id}
                    label={s.label}
                    trailing={s.address.split(",")[0]}
                    onClick={() => onSelectSuggestion(s)}
                  />
                ))}
              </Stack>
            ) : null,
          )}
          {query.trim() ? (
            <button
              type="button"
              onClick={onSubmitTyped}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "none",
                borderTop: `1px solid ${theme.stroke.tertiary}`,
                background: theme.fill.tertiary,
                color: theme.text.primary,
                cursor: "pointer",
                fontSize: 11,
                textAlign: "left",
              }}
            >
              Use &quot;{query.trim()}&quot;
            </button>
          ) : null}
        </Stack>
      ) : null}
      {locationPinned ? (
        <Stack gap={8} style={{ padding: 12, borderTop: `1px solid ${theme.stroke.tertiary}` }}>
          <Text size="small" tone="secondary">
            Check the building outline on the map. Next, align your floorplan to the footprint.
          </Text>
          <Button variant="primary" onClick={onContinueToAlign} style={{ width: "100%" }}>
            Align your file to the map
          </Button>
        </Stack>
      ) : null}
    </Stack>
  );
}

function AlignmentStepContent({
  fileName,
  opacity,
  scale,
  rotation,
  onOpacityChange,
  onScaleChange,
  onRotationChange,
  onConfirm,
}: {
  fileName: string;
  opacity: number;
  scale: number;
  rotation: number;
  onOpacityChange: (v: number) => void;
  onScaleChange: (v: number) => void;
  onRotationChange: (v: number) => void;
  onConfirm: () => void;
}) {
  const theme = useHostTheme();

  const sliderStyle: Record<string, string | number> = {
    flex: 1,
    height: 3,
    cursor: "pointer",
    accentColor: theme.accent.primary,
  };

  const labelStyle: Record<string, string | number> = {
    fontSize: 10,
    color: theme.text.tertiary,
    width: 52,
    flexShrink: 0,
  };

  const valueStyle: Record<string, string | number> = {
    fontSize: 10,
    color: theme.text.secondary,
    width: 32,
    textAlign: "right",
    flexShrink: 0,
  };

  return (
    <Stack gap={12} style={{ padding: 12 }}>
      <Text size="small" tone="secondary">
        {fileName}
      </Text>
      <Stack gap={8}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={labelStyle}>Opacity</span>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.05"
            value={opacity}
            onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
            style={sliderStyle}
          />
          <span style={valueStyle}>{Math.round(opacity * 100)}%</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={labelStyle}>Scale</span>
          <input
            type="range"
            min="0.3"
            max="3"
            step="0.05"
            value={scale}
            onChange={(e) => onScaleChange(parseFloat(e.target.value))}
            style={sliderStyle}
          />
          <span style={valueStyle}>{scale.toFixed(2)}×</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={labelStyle}>Rotation</span>
          <input
            type="range"
            min="-180"
            max="180"
            step="1"
            value={rotation}
            onChange={(e) => onRotationChange(parseFloat(e.target.value))}
            style={sliderStyle}
          />
          <span style={valueStyle}>{rotation}°</span>
        </div>
      </Stack>
      <Button variant="primary" onClick={onConfirm} style={{ width: "100%" }}>
        Confirm alignment
      </Button>
    </Stack>
  );
}

// ─── Floorplan alignment step ─────────────────────────────────────────────────

function FloorplanRasterOverlay({
  opacity,
  scale,
  rotation,
  centerX,
  centerY,
  offsetX,
  offsetY,
}: {
  opacity: number;
  scale: number;
  rotation: number;
  centerX: number;
  centerY: number;
  offsetX: number;
  offsetY: number;
}) {
  const theme = useHostTheme();
  return (
    <div
      style={{
        position: "absolute",
        left: `calc(${centerX}% + ${offsetX}px)`,
        top: `calc(${centerY}% + ${offsetY}px)`,
        transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`,
        transformOrigin: "center center",
        opacity,
        pointerEvents: "none",
        width: 220,
        height: 170,
      }}
    >
      <svg
        width="220"
        height="170"
        viewBox="0 0 220 170"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block" }}
      >
        {/* Blueprint background */}
        <rect width="220" height="170" fill={theme.fill.secondary} />
        {/* Outer walls */}
        <rect x="4" y="4" width="212" height="162" stroke={theme.accent.primary} strokeWidth="2.5" fill="none" />
        {/* Interior horizontal dividers */}
        <line x1="4" y1="60" x2="140" y2="60" stroke={theme.accent.primary} strokeWidth="1.5" />
        <line x1="4" y1="110" x2="180" y2="110" stroke={theme.accent.primary} strokeWidth="1.5" />
        {/* Interior vertical dividers */}
        <line x1="90" y1="4" x2="90" y2="60" stroke={theme.accent.primary} strokeWidth="1.5" />
        <line x1="140" y1="60" x2="140" y2="170" stroke={theme.accent.primary} strokeWidth="1.5" />
        <line x1="60" y1="110" x2="60" y2="170" stroke={theme.accent.primary} strokeWidth="1.5" />
        {/* Door openings (gaps) represented as lighter rectangles */}
        <rect x="88" y="56" width="6" height="8" fill={theme.fill.secondary} />
        <rect x="136" y="56" width="8" height="6" fill={theme.fill.secondary} />
        <rect x="56" y="106" width="8" height="6" fill={theme.fill.secondary} />
        {/* Room hatching / fill areas */}
        <rect x="5" y="5" width="84" height="54" fill={theme.accent.primary} fillOpacity="0.04" />
        <rect x="92" y="5" width="124" height="54" fill={theme.accent.primary} fillOpacity="0.07" />
        <rect x="5" y="62" width="134" height="47" fill={theme.accent.primary} fillOpacity="0.05" />
        <rect x="142" y="62" width="74" height="47" fill={theme.accent.primary} fillOpacity="0.03" />
        <rect x="5" y="112" width="54" height="54" fill={theme.accent.primary} fillOpacity="0.06" />
        <rect x="62" y="112" width="77" height="54" fill={theme.accent.primary} fillOpacity="0.04" />
        <rect x="142" y="112" width="74" height="54" fill={theme.accent.primary} fillOpacity="0.07" />
        {/* Scale bar */}
        <line x1="10" y1="160" x2="50" y2="160" stroke={theme.accent.primary} strokeWidth="1" />
        <line x1="10" y1="157" x2="10" y2="163" stroke={theme.accent.primary} strokeWidth="1" />
        <line x1="50" y1="157" x2="50" y2="163" stroke={theme.accent.primary} strokeWidth="1" />
        {/* Alignment border dashes */}
        <rect
          x="1"
          y="1"
          width="218"
          height="168"
          stroke={theme.accent.primary}
          strokeWidth="1"
          strokeDasharray="6 4"
          fill="none"
          opacity="0.5"
        />
      </svg>
    </div>
  );
}

function CroppedFloorplanOnMap({
  scale,
  rotation,
  offsetX,
  offsetY,
}: {
  scale: number;
  rotation: number;
  offsetX: number;
  offsetY: number;
}) {
  const theme = useHostTheme();
  return (
    <div
      style={{
        position: "absolute",
        left: "27.8%",
        top: "28.1%",
        width: "18.4%",
        height: "32.4%",
        overflow: "hidden",
        clipPath: "polygon(0% 0%, 100% 0%, 100% 8%, 100% 100%, 58% 100%, 58% 42%, 0% 42%)",
        zIndex: 10,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 220,
          height: 170,
          transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px)) scale(${scale}) rotate(${rotation}deg)`,
          transformOrigin: "center center",
        }}
      >
        <svg width="220" height="170" viewBox="0 0 220 170" fill="none" style={{ display: "block" }}>
          <rect width="220" height="170" fill={theme.fill.secondary} />
          <rect x="4" y="4" width="212" height="162" stroke={theme.accent.primary} strokeWidth="2.5" fill="none" />
          <line x1="4" y1="60" x2="140" y2="60" stroke={theme.accent.primary} strokeWidth="1.5" />
          <line x1="4" y1="110" x2="180" y2="110" stroke={theme.accent.primary} strokeWidth="1.5" />
          <line x1="90" y1="4" x2="90" y2="60" stroke={theme.accent.primary} strokeWidth="1.5" />
          <line x1="140" y1="60" x2="140" y2="170" stroke={theme.accent.primary} strokeWidth="1.5" />
          <line x1="60" y1="110" x2="60" y2="170" stroke={theme.accent.primary} strokeWidth="1.5" />
          <rect x="5" y="5" width="84" height="54" fill={theme.accent.primary} fillOpacity="0.06" />
          <rect x="92" y="5" width="124" height="54" fill={theme.accent.primary} fillOpacity="0.09" />
          <rect x="5" y="62" width="134" height="47" fill={theme.accent.primary} fillOpacity="0.07" />
          <rect x="142" y="62" width="74" height="47" fill={theme.accent.primary} fillOpacity="0.05" />
          <rect x="5" y="112" width="54" height="54" fill={theme.accent.primary} fillOpacity="0.08" />
          <rect x="62" y="112" width="77" height="54" fill={theme.accent.primary} fillOpacity="0.06" />
          <rect x="142" y="112" width="74" height="54" fill={theme.accent.primary} fillOpacity="0.09" />
        </svg>
      </div>
    </div>
  );
}

function SiteSelectionStepContent({
  query,
  selectedSiteIds,
  onQueryChange,
  onToggleSite,
  onConfirm,
}: {
  query: string;
  selectedSiteIds: string[];
  onQueryChange: (value: string) => void;
  onToggleSite: (siteId: string) => void;
  onConfirm: () => void;
}) {
  const theme = useHostTheme();
  const sites = filterOrgSites(query);
  const canContinue = selectedSiteIds.length >= 1;

  return (
    <Stack gap={0}>
      <div style={{ padding: "10px 12px", borderBottom: `1px solid ${theme.stroke.tertiary}` }}>
        <TextInput
          value={query}
          onChange={onQueryChange}
          placeholder="Search sites…"
          type="search"
          style={{ width: "100%" }}
        />
      </div>
      <Stack gap={0} style={{ maxHeight: 260, overflow: "auto" }}>
        {sites.length > 0 ? (
          sites.map((site) => {
            const selected = selectedSiteIds.includes(site.id);
            return (
              <button
                key={site.id}
                type="button"
                onClick={() => onToggleSite(site.id)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "none",
                  borderBottom: `1px solid ${theme.stroke.tertiary}`,
                  background: selected ? theme.fill.tertiary : "transparent",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <Row gap={8} align="start">
                  <span style={{ display: "inline-flex", pointerEvents: "none", flexShrink: 0 }}>
                    <Checkbox checked={selected} onChange={() => {}} />
                  </span>
                  <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                    <Text size="small" weight="semibold">
                      {site.name}
                    </Text>
                    <Text size="small" tone="tertiary" style={{ fontSize: 10 }}>
                      {site.code}
                    </Text>
                    <Text size="small" tone="secondary" style={{ fontSize: 10, lineHeight: 1.4 }}>
                      {formatSiteDeviceBreakdown(site)}
                    </Text>
                  </Stack>
                </Row>
              </button>
            );
          })
        ) : (
          <Text size="small" tone="tertiary" style={{ padding: 12 }}>
            No sites match your search.
          </Text>
        )}
      </Stack>
      <Stack gap={8} style={{ padding: 12, borderTop: `1px solid ${theme.stroke.tertiary}` }}>
        <Row gap={8} align="center" justify="between" wrap>
          <Text size="small" tone="tertiary" style={{ flex: 1, minWidth: 120 }}>
            {selectedSiteIds.length === 0
              ? "Select at least one site."
              : `${selectedSiteIds.length} site${selectedSiteIds.length === 1 ? "" : "s"} selected`}
          </Text>
          <Button
            variant="primary"
            onClick={onConfirm}
            style={{ flexShrink: 0, opacity: canContinue ? 1 : 0.45 }}
            disabled={!canContinue}
          >
            Start Plotting Devices
          </Button>
        </Row>
      </Stack>
    </Stack>
  );
}

function PrototypeFrame({
  state,
  setState,
  showDropHint,
}: {
  state: AppState;
  setState: (patch: Partial<AppState>) => void;
  showDropHint?: boolean;
}) {
  const theme = useHostTheme();
  const selectedPlace = LOCATIONS.find((l) => l.id === state.selectedPlaceId) ?? null;

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
    });
  };

  const enterEditorFromManage = () => {
    setState({
      editorEntry: "in-context",
      editorMode: true,
      orgHasFloorplans: true,
      selectedPlaceId: "floor-3",
      editorTool: "Select",
      editorRightTab: "tools",
    });
  };

  const isFirstVisitFlow = !state.orgHasFloorplans && !state.editorMode && state.editorEntry !== "manage-home";
  const isFirstVisitUpload = isFirstVisitFlow && (state.uploadStage === "idle" || state.uploadStage === "confirmed");
  const isLocatingFloorplan = isFirstVisitFlow && state.uploadStage === "locating";
  const isAligningFloorplan = isFirstVisitFlow && state.uploadStage === "aligning";
  const isSelectingSites = isFirstVisitFlow && state.uploadStage === "select-sites";
  const isLocationFlowMap = isLocatingFloorplan || isAligningFloorplan || isSelectingSites;

  const uploadedFiles = state.uploadedFiles ?? [];
  const locatingFile = uploadedFiles.find((f) => f.id === state.locatingFileId) ?? null;

  const simulateFileUpload = () => {
    const nextName = MOCK_UPLOAD_FILES[uploadedFiles.length % MOCK_UPLOAD_FILES.length];
    const id = `file-${uploadedFiles.length + 1}`;
    setState({
      uploadStage: "confirmed",
      uploadedFiles: [...uploadedFiles, { id, fileName: nextName, locationAddress: null }],
      filesFlyoutOpen: false,
    });
  };

  const removeUploadedFile = (id: string) => {
    const next = uploadedFiles.filter((f) => f.id !== id);
    setState({
      uploadedFiles: next,
      uploadStage: next.length === 0 ? "idle" : "confirmed",
      locatingFileId: state.locatingFileId === id ? null : state.locatingFileId,
    });
  };

  const beginLocationForFile = (fileId: string) => {
    setState({
      uploadStage: "locating",
      locatingFileId: fileId,
      locationQuery: "",
      locationSearchFocused: false,
      locationPinned: false,
      selectedAddressId: null,
      locationPinX: 48,
      locationPinY: 52,
    });
  };

  const cancelLocationSetup = () => {
    setState({
      uploadStage: "confirmed",
      locatingFileId: null,
      locationQuery: "",
      locationSearchFocused: false,
      locationPinned: false,
      selectedAddressId: null,
    });
  };

  const selectVerkadaAddress = (suggestion: VerkadaAddressSuggestion) => {
    setState({
      locationQuery: suggestion.address,
      locationSearchFocused: false,
      locationPinned: true,
      selectedAddressId: suggestion.id,
      locationPinX: suggestion.mapCenter.x,
      locationPinY: suggestion.mapCenter.y,
    });
  };

  const submitTypedAddress = () => {
    const q = state.locationQuery.trim();
    if (!q) return;
    setState({
      locationSearchFocused: false,
      locationPinned: true,
      selectedAddressId: null,
      locationPinX: 50,
      locationPinY: 52,
    });
  };

  const activeAddressSuggestion = getAddressSuggestion(state.selectedAddressId ?? null);
  const locatingBuildingOutline =
    activeAddressSuggestion?.buildingOutline ?? "38%,38% 62%,36% 64%,58% 40%,60%";
  const locatingMapCenter = activeAddressSuggestion?.mapCenter ?? {
    x: state.locationPinX,
    y: state.locationPinY,
  };

  const confirmFloorplanLocation = () => {
    if (!state.locatingFileId) return;
    const address = state.locationQuery.trim() || "Pinned on map";
    const nextFiles = uploadedFiles.map((f) =>
      f.id === state.locatingFileId ? { ...f, locationAddress: address } : f,
    );
    // Always enter alignment step after confirming location
    setState({
      uploadedFiles: nextFiles,
      uploadStage: "aligning",
      locationSearchFocused: false,
      alignOpacity: 0.65,
      alignScale: 1,
      alignRotation: 0,
      alignOffsetX: 0,
      alignOffsetY: 0,
    });
  };

  const confirmAlignment = () => {
    setState({
      uploadStage: "select-sites",
      alignOpacity: 1,
      siteSearchQuery: "",
      selectedSiteIds: [],
    });
  };

  const backFromSiteSelection = () => {
    setState({
      uploadStage: "aligning",
      siteSearchQuery: "",
      selectedSiteIds: [],
    });
  };

  const toggleSiteSelection = (siteId: string) => {
    const current = state.selectedSiteIds ?? [];
    const next = current.includes(siteId) ? current.filter((id) => id !== siteId) : [...current, siteId];
    setState({ selectedSiteIds: next });
  };

  const confirmSiteSelection = () => {
    if ((state.selectedSiteIds ?? []).length === 0) return;
    const selectedSiteIds = state.selectedSiteIds ?? [];
    const allLocated = uploadedFiles.every((f) => f.locationAddress);
    if (allLocated && uploadedFiles.length === 1) {
      setState({
        orgHasFloorplans: true,
        uploadStage: "idle",
        uploadedFiles: [],
        locatingFileId: null,
        locationQuery: "",
        locationSearchFocused: false,
        locationPinned: false,
        selectedAddressId: null,
        siteSearchQuery: "",
        selectedSiteIds,
        selectedPlaceId: "floor-3",
        editorMode: true,
        editorEntry: "in-context",
        editorTool: "Select",
        editorRightTab: "devices",
        stampActive: false,
      });
      return;
    }
    setState({
      uploadStage: "confirmed",
      locatingFileId: null,
      locationQuery: "",
      locationSearchFocused: false,
      locationPinned: false,
      selectedAddressId: null,
      siteSearchQuery: "",
      selectedSiteIds: [],
    });
  };

  const openFilesUpload = () => {
    if (isFirstVisitFlow) return;
    setState({ filesFlyoutOpen: true, editorEntry: "none" });
  };

  if (state.editorEntry === "manage-home") {
    return (
      <WireBox style={{ position: "relative", height: 520, overflow: "hidden", background: theme.bg.editor }}>
        <WireBox
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 36,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "0 12px",
            borderRadius: 0,
            borderLeft: "none",
            borderRight: "none",
            borderTop: "none",
          }}
        >
          <Text size="small" tone="tertiary">
            Command
          </Text>
          <Text size="small">Maps › Manage Maps</Text>
          {!state.orgHasFloorplans ? (
            <>
              <Chip label="No floorplan" tone="neutral" />
              <Spacer />
              <Button variant="ghost" onClick={() => setState({ editorEntry: "none" })}>
                Back to map
              </Button>
            </>
          ) : null}
        </WireBox>
        <div style={{ position: "absolute", top: 36, left: 0, right: 0, bottom: 0 }}>
          <ManageMapsHome
            empty={!state.orgHasFloorplans}
            onOpenFloor={enterEditorFromManage}
            onCreateBuilding={openFilesUpload}
            onImportFiles={openFilesUpload}
          />
        </div>
      </WireBox>
    );
  }

  const rightPanelWidth = state.editorMode ? 240 : 0;

  return (
    <WireBox style={{ position: "relative", height: 520, overflow: "hidden", background: theme.bg.editor }}>
      {/* Command band */}
      <WireBox
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 36,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 12px",
          borderRadius: 0,
          borderLeft: "none",
          borderRight: "none",
          borderTop: "none",
          zIndex: 30,
        }}
      >
        <Text size="small" tone="tertiary">
          Command
        </Text>
        <Text size="small">Maps</Text>
        <Spacer />
        <Text size="small" tone="secondary">
          ankush.rustagi
        </Text>
      </WireBox>

      {/* Editor top bar */}
      {state.editorMode ? (
        <WireBox
          style={{
            position: "absolute",
            top: 36,
            left: 40,
            right: rightPanelWidth,
            height: 40,
            zIndex: 25,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "0 12px",
            borderRadius: 0,
            borderLeft: "none",
            borderRight: "none",
            borderTop: "none",
          }}
        >
          <Button
            variant="ghost"
            onClick={() =>
              setState({ editorMode: false, editorEntry: "none", selectedMarkerId: null, stampActive: false })
            }
          >
            Exit edit
          </Button>
          <Text size="small" weight="semibold">
            {selectedPlace?.label ?? "Floor 3"} · Main Building
          </Text>
          <Spacer />
          <Button variant="ghost" disabled={state.undoCount === 0}>
            Undo ({state.undoCount})
          </Button>
          <Button variant="ghost" disabled={state.redoCount === 0}>
            Redo
          </Button>
          <Chip label="Saved" tone="success" />
        </WireBox>
      ) : null}

      {/* Tool strip */}
      {state.editorMode ? (
        <WireBox
          style={{
            position: "absolute",
            top: 82,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 25,
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "4px 8px",
          }}
        >
          <Button
            variant={state.editorRightTab === "devices" ? "primary" : "ghost"}
            onClick={() => openDrawDevicesPanel(setState)}
            style={{ fontSize: 10, marginRight: 4 }}
          >
            Draw Devices
          </Button>
          {EDITOR_TOOLS.map((t) => (
            <Button
              key={t}
              variant={state.editorTool === t ? "primary" : "ghost"}
              onClick={() =>
                setState({
                  editorTool: t,
                  editorRightTab: t === "Select" ? "tools" : t === "Camera" || t === "Sensor" ? "devices" : "properties",
                  stampActive: t === "Camera" || t === "Sensor",
                  selectedMarkerId: t === "Select" ? state.selectedMarkerId : null,
                })
              }
              style={{ fontSize: 10 }}
            >
              {t}
            </Button>
          ))}
        </WireBox>
      ) : null}

      {/* Map canvas */}
      <div
        style={{
          position: "absolute",
          top: state.editorMode ? 76 : 36,
          left: 0,
          right: rightPanelWidth,
          bottom: 0,
          background: isLocationFlowMap
            ? theme.fill.quaternary
            : isFirstVisitUpload
              ? theme.bg.editor
              : theme.fill.quaternary,
          cursor: "default",
        }}
        onClick={() => {
          if (state.searchFocused) setState({ searchFocused: false, searchQuery: "" });
        }}
      >
        {isFirstVisitUpload ? <GlobeBackdrop /> : null}

        {isLocationFlowMap ? (
          state.locationPinned || isAligningFloorplan || isSelectingSites ? (
            <ZoomedStreetMapBackdrop buildingOutline={locatingBuildingOutline} center={locatingMapCenter} address={state.locationQuery || undefined} />
          ) : (
            <WorldMapBackdrop />
          )
        ) : null}

        {!isFirstVisitUpload && !isLocationFlowMap ? (
        <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: state.orgHasFloorplans ? 0.35 : 0.2 }}>
          <defs>
            <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke={theme.stroke.tertiary} strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          {state.orgHasFloorplans ? (
            <>
              <rect x="18%" y="22%" width="52%" height="48%" fill="none" stroke={theme.stroke.secondary} strokeWidth="1.5" />
              <rect x="28%" y="32%" width="18%" height="14%" fill="none" stroke={theme.stroke.secondary} strokeWidth="1" />
              <rect x="52%" y="38%" width="12%" height="20%" fill="none" stroke={theme.stroke.secondary} strokeWidth="1" />
            </>
          ) : (
            <>
              <rect x="8%" y="12%" width="84%" height="76%" fill={theme.fill.tertiary} opacity="0.4" />
              <text x="50%" y="48%" fill={theme.text.tertiary} fontSize="12" textAnchor="middle">
                Satellite basemap
              </text>
            </>
          )}
        </svg>
        ) : null}

        {state.orgHasFloorplans ? <EditorCanvasOverlays state={state} /> : null}

        {showDropHint ? (
          <WireBox
            style={{
              position: "absolute",
              inset: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderStyle: "dashed",
              background: theme.fill.tertiary,
              zIndex: 15,
            }}
          >
            <Stack gap={6} style={{ alignItems: "center" }}>
              <Text weight="semibold">Drop floorplan to attach + align</Text>
              <Text size="small" tone="secondary">
                Path B: one drop replaces 3-step wizard when Place is selected
              </Text>
            </Stack>
          </WireBox>
        ) : null}

        {isFirstVisitUpload ? (
          <FirstVisitUploadCard
            uploadedFiles={uploadedFiles}
            onUploadFile={simulateFileUpload}
            onRemoveFile={removeUploadedFile}
            onSetLocation={beginLocationForFile}
          />
        ) : null}

        {isLocatingFloorplan && locatingFile ? (
          <LocationFlowSidePanel step="search" fileName={locatingFile.fileName} onBack={cancelLocationSetup}>
            <LocationSearchStepContent
              query={state.locationQuery}
              searchFocused={state.locationSearchFocused ?? false}
              locationPinned={state.locationPinned ?? false}
              onFocus={() => setState({ locationSearchFocused: true })}
              onChange={(value) =>
                setState({
                  locationQuery: value,
                  locationSearchFocused: true,
                  locationPinned: false,
                  selectedAddressId: null,
                })
              }
              onSelectSuggestion={selectVerkadaAddress}
              onSubmitTyped={submitTypedAddress}
              onContinueToAlign={confirmFloorplanLocation}
            />
          </LocationFlowSidePanel>
        ) : null}

        {isAligningFloorplan ? (
          <>
            <FloorplanRasterOverlay
              opacity={state.alignOpacity ?? 0.65}
              scale={state.alignScale ?? 1}
              rotation={state.alignRotation ?? 0}
              centerX={locatingMapCenter.x}
              centerY={locatingMapCenter.y}
              offsetX={state.alignOffsetX ?? 0}
              offsetY={state.alignOffsetY ?? 0}
            />
            <LocationFlowSidePanel step="align" fileName={locatingFile?.fileName ?? "Floorplan"}>
              <AlignmentStepContent
                fileName={locatingFile?.fileName ?? "Floorplan"}
                opacity={state.alignOpacity ?? 0.65}
                scale={state.alignScale ?? 1}
                rotation={state.alignRotation ?? 0}
                onOpacityChange={(v) => setState({ alignOpacity: v })}
                onScaleChange={(v) => setState({ alignScale: v })}
                onRotationChange={(v) => setState({ alignRotation: v })}
                onConfirm={confirmAlignment}
              />
            </LocationFlowSidePanel>
          </>
        ) : null}

        {isSelectingSites ? (
          <>
            <CroppedFloorplanOnMap
              scale={state.alignScale ?? 1}
              rotation={state.alignRotation ?? 0}
              offsetX={state.alignOffsetX ?? 0}
              offsetY={state.alignOffsetY ?? 0}
            />
            <LocationFlowSidePanel
              step="select-sites"
              fileName={locatingFile?.fileName ?? "Floorplan"}
              onBack={backFromSiteSelection}
            >
              <SiteSelectionStepContent
                query={state.siteSearchQuery ?? ""}
                selectedSiteIds={state.selectedSiteIds ?? []}
                onQueryChange={(value) => setState({ siteSearchQuery: value })}
                onToggleSite={toggleSiteSelection}
                onConfirm={confirmSiteSelection}
              />
            </LocationFlowSidePanel>
          </>
        ) : null}

        {state.orgHasFloorplans
          ? MARKERS.map((marker) => {
          const selected = state.selectedMarkerId === marker.id;
          return (
            <button
              key={marker.id}
              type="button"
              title={marker.label}
              onClick={(e) => {
                e.stopPropagation();
                if (state.editorMode)
                  setState({
                    selectedMarkerId: marker.id,
                    editorTool: "Select",
                    editorRightTab: "properties",
                    showFovCones: marker.kind === "Camera",
                    stampActive: false,
                  });
              }}
              style={{
                position: "absolute",
                left: `${marker.x}%`,
                top: `${marker.y}%`,
                transform: "translate(-50%, -50%)",
                width: state.editorMode ? 10 : 7,
                height: state.editorMode ? 10 : 7,
                borderRadius: 999,
                border: `2px solid ${selected ? theme.accent.primary : theme.stroke.secondary}`,
                background: marker.status === "Online" ? theme.fill.secondary : theme.diff.removed,
                cursor: state.editorMode ? "pointer" : "default",
                padding: 0,
              }}
            />
          );
        })
          : null}

        {!isFirstVisitFlow ? (
        <Text
          size="small"
          tone="tertiary"
          style={{ position: "absolute", top: 12, right: 180, fontSize: 10, fontFamily: "monospace" }}
        >
          {!state.orgHasFloorplans
            ? "Basemap · no floorplan"
            : selectedPlace?.kind === "floor"
              ? `${selectedPlace.label} · Main Bldg`
              : "Floor 3 · Main Bldg"}
        </Text>
        ) : null}

        {/* Site + Alerts cluster — hidden in editor mode and first visit landing */}
        {!state.editorMode && !isFirstVisitFlow ? (
        <WireBox
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 160,
            zIndex: 20,
            padding: 0,
            overflow: "hidden",
          }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setState({ sitePickerOpen: !state.sitePickerOpen });
            }}
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "8px 10px",
              border: "none",
              background: "transparent",
              color: theme.text.primary,
              cursor: "pointer",
              fontSize: 11,
            }}
          >
            <span>{state.orgHasFloorplans ? "Sites: HQ-MAIN" : "156 devices"}</span>
            <span style={{ color: theme.text.tertiary }}>{state.orgHasFloorplans ? "12 places" : "not on map"}</span>
          </button>
          {state.sitePickerOpen && state.orgHasFloorplans ? (
            <Stack gap={0} style={{ borderTop: `1px solid ${theme.stroke.tertiary}` }}>
              {["HQ-MAIN", "EC-01", "WH-01"].map((site) => (
                <PanelListRow key={site} label={site} trailing={site === "HQ-MAIN" ? "active" : undefined} />
              ))}
            </Stack>
          ) : null}
          <div style={{ borderTop: `1px solid ${theme.stroke.tertiary}`, padding: "8px 10px" }}>
            <Row justify="space-between">
              <Text size="small">Alerts & Events</Text>
              {state.orgHasFloorplans ? <Chip label="2" tone="warning" /> : <Chip label="0" tone="neutral" />}
            </Row>
            {state.orgHasFloorplans ? (
              <Stack gap={4} style={{ marginTop: 6 }}>
                <Text size="small" tone="secondary">
                  Door forced open · Lobby
                </Text>
                <Text size="small" tone="secondary">
                  After-hours motion · Dock 4
                </Text>
              </Stack>
            ) : (
              <Text size="small" tone="tertiary" style={{ marginTop: 6 }}>
                Alerts will map to floor locations after you upload a floorplan.
              </Text>
            )}
          </div>
        </WireBox>
        ) : null}

        {/* Zoom controls */}
        <Stack gap={4} style={{ position: "absolute", bottom: 12, right: 12 }}>
          {["+", "−"].map((z) => (
            <WireBox key={z} style={{ width: 28, height: 28, display: "grid", placeItems: "center", fontSize: 14 }}>
              {z}
            </WireBox>
          ))}
        </Stack>

        {/* Layers cluster toggle */}
        {!isFirstVisitFlow ? (
        <Button
          variant="secondary"
          onClick={(e) => {
            e.stopPropagation();
            setState({ layersClusterOpen: !state.layersClusterOpen });
          }}
          style={{ position: "absolute", bottom: 12, left: 12, fontSize: 10 }}
        >
          Layers · {state.orgHasFloorplans ? `${state.activeLayers.length} on` : "none"}
        </Button>
        ) : null}

        {!isFirstVisitFlow && state.layersClusterOpen ? (
          <WireBox style={{ position: "absolute", bottom: 48, left: 12, width: 220, padding: 10, zIndex: 20 }}>
            <Text weight="semibold" style={{ fontSize: 11 }}>
              Layers
            </Text>
            <Text size="small" tone="secondary">
              {state.orgHasFloorplans ? "31 devices · None selected" : "156 devices · not on map yet"}
            </Text>
            <Grid columns={2} gap={8} style={{ marginTop: 8 }}>
              <Stack gap={4}>
                <Text size="small" tone="tertiary" style={{ fontSize: 10 }}>
                  Devices
                </Text>
                {["Cameras", "Doors", "Sensors"].map((d) => (
                  <Text key={d} size="small">
                    [x] {d}
                  </Text>
                ))}
              </Stack>
              <Stack gap={4}>
                <Text size="small" tone="tertiary" style={{ fontSize: 10 }}>
                  Data overlay
                </Text>
                {["Status", "Coverage", "Events"].map((d, i) => (
                  <Text key={d} size="small">
                    {i === 0 ? "(o)" : "( )"} {d}
                  </Text>
                ))}
              </Stack>
            </Grid>
            <Row gap={8} style={{ marginTop: 8 }}>
              <Pill size="sm">Satellite</Pill>
              <Pill size="sm">Dark</Pill>
            </Row>
          </WireBox>
        ) : null}

        {/* Active layer pills */}
        {!isFirstVisitFlow && state.activeLayers.length > 0 && !state.layersClusterOpen ? (
          <Stack gap={4} style={{ position: "absolute", bottom: 48, right: 12, alignItems: "flex-end" }}>
            {state.activeLayers.slice(0, 3).map((l) => (
              <Chip key={l} label={l} />
            ))}
          </Stack>
        ) : null}
      </div>

      {/* Left rail + panel — hidden on first visit landing */}
      {!isFirstVisitFlow ? (
      <>
      <WireBox
        style={{
          position: "absolute",
          top: 36,
          left: 0,
          bottom: 0,
          width: 40,
          borderRadius: 0,
          borderTop: "none",
          borderBottom: "none",
          borderLeft: "none",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: 8,
          gap: 6,
          zIndex: 20,
        }}
      >
        <Button variant="ghost" style={{ fontSize: 10, padding: "2px 4px" }} onClick={() => setState({ filesFlyoutOpen: !state.filesFlyoutOpen })}>
          Menu
        </Button>
        {RAIL_ITEMS.map((item) => {
          const active =
            state.rail === item.id &&
            !state.selectedPlaceId &&
            !state.editorMode &&
            !state.searchFocused;
          return (
            <button
              key={item.id}
              type="button"
              title={item.label}
              onClick={() => switchRail(item.id)}
              style={{
                width: 28,
                height: 28,
                borderRadius: 4,
                border: `1px solid ${active ? theme.stroke.primary : theme.stroke.tertiary}`,
                background: active ? theme.fill.secondary : "transparent",
                color: theme.text.primary,
                fontSize: 10,
                cursor: "pointer",
              }}
            >
              {item.abbr}
            </button>
          );
        })}
      </WireBox>

      {/* Left panel */}
      <WireBox
        style={{
          position: "absolute",
          top: state.editorMode ? 76 : 36,
          left: 40,
          bottom: 0,
          width: 220,
          borderRadius: 0,
          borderTop: "none",
          borderBottom: "none",
          display: "flex",
          flexDirection: "column",
          zIndex: 20,
          padding: 0,
          overflow: "hidden",
        }}
      >
        <div style={{ padding: 8, borderBottom: `1px solid ${theme.stroke.tertiary}` }}>
          {!state.editorMode && state.searchFocused ? (
            <Row gap={6}>
              <TextInput
                value={state.searchQuery}
                onChange={(value) => setState({ searchQuery: value })}
                placeholder="Search Verkada Maps…"
                type="search"
                style={{ flex: 1, minWidth: 0 }}
              />
              <Button variant="ghost" onClick={() => setState({ searchFocused: false, searchQuery: "" })}>
                x
              </Button>
            </Row>
          ) : !state.editorMode ? (
            <Button
              variant="secondary"
              onClick={() => setState({ searchFocused: true })}
              style={{ width: "100%", justifyContent: "flex-start", fontSize: 11 }}
            >
              Search Verkada Maps…
            </Button>
          ) : (
            <Text size="small" tone="tertiary" style={{ padding: "4px 0" }}>
              Floor context
            </Text>
          )}
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <LeftPanelContent state={state} setState={setState} />
        </div>
      </WireBox>
      </>
      ) : null}

      {/* Editor right panel */}
      {state.editorMode ? (
        <WireBox
          style={{
            position: "absolute",
            top: 36,
            right: 0,
            bottom: 0,
            width: rightPanelWidth,
            borderRadius: 0,
            borderTop: "none",
            borderBottom: "none",
            borderRight: "none",
            zIndex: 20,
            padding: 0,
            overflow: "hidden",
          }}
        >
          <EditorRightPanel state={state} setState={setState} />
        </WireBox>
      ) : null}

      {/* Files flyout — not shown on first visit landing (drop zone is inline) */}
      {state.filesFlyoutOpen && !isFirstVisitFlow ? (
        <WireBox
          style={{
            position: "absolute",
            top: 72,
            left: 48,
            width: 200,
            zIndex: 40,
            padding: 10,
          }}
        >
          <Row justify="space-between" align="center">
            <Text weight="semibold" style={{ fontSize: 11 }}>
              Files
            </Text>
            <Button variant="ghost" onClick={() => setState({ filesFlyoutOpen: false })}>
              x
            </Button>
          </Row>
          <WireBox
            style={{
              marginTop: 8,
              padding: 16,
              borderStyle: "dashed",
              textAlign: "center",
              background: theme.fill.tertiary,
            }}
          >
            <Text size="small" tone="secondary">
              Drop files here
            </Text>
            <Button variant="primary" style={{ marginTop: 8 }}>
              Upload
            </Button>
          </WireBox>
          <Stack gap={6} style={{ marginTop: 10 }}>
            <Text size="small" tone="tertiary" style={{ fontSize: 10, textTransform: "uppercase" }}>
              Unplaced
            </Text>
            {state.orgHasFloorplans ? (
              <Row justify="space-between" align="center">
                <Text size="small">Floor-4-draft.pdf</Text>
                <Button variant="secondary" style={{ fontSize: 10 }}>
                  Bind to Place
                </Button>
              </Row>
            ) : (
              <Text size="small" tone="secondary">
                Uploaded files appear here before a building exists.
              </Text>
            )}
          </Stack>
        </WireBox>
      ) : null}
    </WireBox>
  );
}

export function EditorPrototype() {
  const [state, setStateRaw] = useCanvasState<AppState>("maps2-nav-mock", {
    rail: "map",
    searchFocused: false,
    searchQuery: "",
    selectedPlaceId: null,
    placeTab: "overview",
    editorMode: false,
    editorEntry: "none",
    editorTool: "Select",
    editorRightTab: "tools",
    selectedMarkerId: null,
    stampActive: false,
    showFovCones: false,
    undoCount: 0,
    redoCount: 0,
    activeLayers: [],
    expandedCollectionId: null,
    collTab: "mine",
    sitePickerOpen: false,
    filesFlyoutOpen: false,
    layersClusterOpen: false,
    orgHasFloorplans: false,
    uploadStage: "idle",
    uploadedFiles: [],
    locatingFileId: null,
    locationQuery: "",
    locationSearchFocused: false,
    locationPinned: false,
    selectedAddressId: null,
    locationPinX: 48,
    locationPinY: 52,
    alignOpacity: 0.65,
    alignScale: 1,
    alignRotation: 0,
    alignOffsetX: 0,
    alignOffsetY: 0,
    siteSearchQuery: "",
    selectedSiteIds: [],
  });
  const [activePreset, setActivePreset] = useCanvasState<string>("maps2-nav-preset", "first-visit");
  const [workspaceFocus, setWorkspaceFocus] = useCanvasState<WorkspaceFocus>("maps2-workspace-focus", "editor");

  const setState = useCallback(
    (patch: Partial<AppState>) => setStateRaw((prev) => mergeAppState(prev, patch)),
    [setStateRaw],
  );

  const jumpToPreset = useCallback(
    (id: string) => {
      const preset = PRESET_STATES.find((p) => p.id === id);
      if (!preset) return;
      setActivePreset(id);
      const base = FIRST_VISIT_PRESET_IDS.has(id)
          ? getFirstVisitDefault()
          : EDITOR_PRESETS.some((p) => p.id === id)
            ? getEditorDefault()
            : getDefaultState();
      setStateRaw(mergeAppState(base, preset.state));
    },
    [setActivePreset, setStateRaw],
  );

  const currentPreset = PRESET_STATES.find((p) => p.id === activePreset) ?? EDITOR_PRESETS[0];
  const showDropHint = activePreset === "editor-drop";

  const visiblePresets = workspaceFocus === "editor" ? EDITOR_PRESETS : PRESET_STATES;

  return (
    <Stack gap={20}>
      <Stack gap={6}>
        <H1>Azalea&apos;s Maps 2.0 Canvas</H1>
        <Text tone="secondary">
          Editor experience workspace — first visit to Maps (state 0), in-context edit mode, tool palette,
          device placement, and structural drawing. Built on the{" "}
          <Link href="https://ankush-rustagi.github.io/maps-2-0-nav-audit/">Navigation Audit</Link> IA with
          Maps v1 PRD editor MVP scope.
        </Text>
        <Row gap={6} wrap>
          <Pill
            active={workspaceFocus === "editor"}
            onClick={() => setWorkspaceFocus("editor")}
            size="sm"
          >
            Editor focus
          </Pill>
          <Pill
            active={workspaceFocus === "full"}
            onClick={() => setWorkspaceFocus("full")}
            size="sm"
          >
            Full IA
          </Pill>
          <Pill size="sm">{EDITOR_PRESETS.length} editor states</Pill>
          <Pill size="sm">PRD M2 MVP</Pill>
        </Row>
      </Stack>

      <Grid columns="220px 1fr" gap={16} align="start">
        <Stack gap={8}>
          <H3>{workspaceFocus === "editor" ? "Editor states" : "All states"}</H3>
          <Stack gap={4}>
            {visiblePresets.map((preset) => (
              <Button
                key={preset.id}
                variant={activePreset === preset.id ? "primary" : "ghost"}
                onClick={() => jumpToPreset(preset.id)}
                style={{ width: "100%", justifyContent: "flex-start", fontSize: 10, textAlign: "left" }}
                title={preset.description}
              >
                {preset.label}
              </Button>
            ))}
          </Stack>
        </Stack>

        <Stack gap={12}>
          <Row gap={8} align="center" wrap>
            <Text size="small" tone="secondary">
              State:
            </Text>
            <Text size="small" weight="semibold">
              {stateLabel(state)}
            </Text>
            <Button variant="ghost" onClick={() => jumpToPreset("first-visit")}>
              Reset to first visit
            </Button>
            <Button variant="ghost" onClick={() => jumpToPreset("editor-idle")}>
              Jump to editor idle
            </Button>
          </Row>

          <PrototypeFrame state={state} setState={setState} showDropHint={showDropHint} />

          <Callout tone="info" title={currentPreset.label}>
            {currentPreset.description}
          </Callout>
        </Stack>
      </Grid>

      <Divider />

      <Stack gap={10}>
        <H2>Editor layout</H2>
        <Text tone="secondary">
          Hybrid entry: first visit (0) → upload files with per-file Set location → globe address search (0c) →
          editor align. Each floorplan can map to a different building address.
        </Text>
        <Grid columns={3} gap={12}>
          <Stack gap={4}>
            <Text weight="semibold">Left panel</Text>
            <Text size="small" tone="secondary">
              Floor breadcrumb, placed devices, unplaced device shortcuts
            </Text>
          </Stack>
          <Stack gap={4}>
            <Text weight="semibold">Canvas</Text>
            <Text size="small" tone="secondary">
              Tool overlays: walls, FOV cones, cables, rulers, areas, stamp cursor
            </Text>
          </Stack>
          <Stack gap={4}>
            <Text weight="semibold">Right panel (340px target)</Text>
            <Text size="small" tone="secondary">
              Tools grouped by Structural / Devices / Paths / Space — swaps to properties per selection
            </Text>
          </Stack>
        </Grid>
      </Stack>

      <Stack gap={8}>
        <H2>PRD P0 editor scope</H2>
        <Grid columns={2} gap={8}>
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
            <Text key={item} size="small" tone="secondary">
              · {item}
            </Text>
          ))}
        </Grid>
      </Stack>

      <Text size="small" tone="tertiary">
        Source: Maps v1 PRD · IA draft §6 · Site Planner editor · nav audit mock · May 2026
      </Text>
    </Stack>
  );
}
