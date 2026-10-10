import { useEffect, useMemo, useRef, useState } from "react";
import { longJourney } from "@server/data/maps/longJourney";
import { axialToPixel, hexPoints } from "@server/data/maps/hexGeometry";
import type { Direction, Edge, HexCell } from "@shared/types";
import { CleanMap } from "./components/CleanMap";
import { GamePrototype } from "./components/GamePrototype";

const EDGES: Edge[] = ["NW", "NE", "E", "SE", "SW", "W"];
const DIRECTIONS: Array<{ id: Direction; label: string }> = [
  { id: "red", label: "Red / West" },
  { id: "blue", label: "Blue / East" },
  { id: "yellow", label: "Yellow / North" },
];

type AuditSettings = {
  overlay: boolean;
  coordinates: boolean;
  edgeLabels: boolean;
  arrows: boolean;
  animations: boolean;
  referenceOpacity: number;
  gridOpacity: number;
  radius: number;
  originX: number;
  originY: number;
};

const initialSettings: AuditSettings = {
  overlay: true,
  coordinates: true,
  edgeLabels: true,
  arrows: true,
  animations: true,
  referenceOpacity: 62,
  gridOpacity: 88,
  radius: 96,
  originX: 600,
  originY: 600,
};

const EDGE_ANGLES: Record<Edge, number> = {
  NE: -90,
  E: -30,
  SE: 30,
  SW: 90,
  W: 150,
  NW: 210,
};

function edgePosition(x: number, y: number, radius: number, edge: Edge, multiplier = 0.82) {
  const angle = (EDGE_ANGLES[edge] * Math.PI) / 180;
  return { x: x + Math.cos(angle) * radius * multiplier, y: y + Math.sin(angle) * radius * multiplier };
}

function cloneCells(): HexCell[] {
  return longJourney.cells.map((cell) => ({
    ...cell,
    exits: Object.fromEntries(
      Object.entries(cell.exits).map(([direction, exit]) => [direction, exit ? { ...exit } : exit]),
    ),
  }));
}

function ControlSwitch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="control-switch">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <i aria-hidden="true" />
    </label>
  );
}

function Metric({ value, label, tone = "neutral" }: { value: string | number; label: string; tone?: "neutral" | "warn" | "good" }) {
  return (
    <div className={`metric metric--${tone}`}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function MapCanvas({
  cells,
  settings,
  activeId,
  onSelect,
  referenceUrl,
}: {
  cells: HexCell[];
  settings: AuditSettings;
  activeId: string;
  onSelect: (id: string) => void;
  referenceUrl: string | null;
}) {
  return (
    <svg className="map-svg" viewBox="0 0 1200 1200" role="img" aria-label="Long Journey flat-top hex audit map">
      <defs>
        <radialGradient id="seaGlow" cx="50%" cy="45%" r="70%">
          <stop offset="0%" stopColor="#164d50" />
          <stop offset="65%" stopColor="#0a3034" />
          <stop offset="100%" stopColor="#061b20" />
        </radialGradient>
        <pattern id="wavePattern" width="82" height="44" patternUnits="userSpaceOnUse">
          <path d="M-20 24 Q0 8 20 24 T60 24 T100 24" fill="none" stroke="#d7c28a" strokeOpacity=".08" strokeWidth="1.2" />
          <path d="M2 40 Q14 32 26 40" fill="none" stroke="#d7c28a" strokeOpacity=".045" strokeWidth="1" />
        </pattern>
        <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#001012" floodOpacity=".55" />
        </filter>
        <marker id="arrowRed" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="#ef705f" /></marker>
        <marker id="arrowBlue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="#68bde4" /></marker>
        <marker id="arrowYellow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="#e8c95c" /></marker>
      </defs>

      <rect width="1200" height="1200" fill="url(#seaGlow)" />
      <rect width="1200" height="1200" fill="url(#wavePattern)" />
      {referenceUrl ? (
        <image href={referenceUrl} width="1200" height="1200" preserveAspectRatio="xMidYMid meet" opacity={settings.referenceOpacity / 100} />
      ) : (
        <g className="reference-empty">
          <path d="M228 175 C310 110 406 131 470 194 C540 263 593 261 673 188 C750 118 855 118 962 194 L918 601 C823 653 731 631 663 586 C581 532 507 533 424 592 C350 645 278 637 233 596Z" />
          <text x="600" y="356">REFERENCE PHOTO NOT ATTACHED</text>
          <text x="600" y="389" className="reference-empty__sub">Load the original board photo from the control panel</text>
        </g>
      )}

      {settings.overlay && (
        <g opacity={settings.gridOpacity / 100} className="hex-layer">
          {cells.map((cell) => {
            const center = axialToPixel(cell.q, cell.r, settings.radius, settings.originX, settings.originY);
            const active = cell.id === activeId;
            return (
              <g key={cell.id} className={`hex-cell ${active ? "is-active" : ""} ${cell.verified ? "is-verified" : "is-unverified"}`} onClick={() => onSelect(cell.id)} role="button" tabIndex={0} onKeyDown={(event) => event.key === "Enter" && onSelect(cell.id)} aria-label={`Select ${cell.id}`}>
                <polygon points={hexPoints(center.x, center.y, settings.radius - 1.5)} filter={active ? "url(#shadow)" : undefined} />
                <circle cx={center.x} cy={center.y} r="3" className="hex-center" />
                <text x={center.x} y={center.y - (settings.coordinates ? 7 : -4)} className="hex-id">{cell.id}</text>
                {settings.coordinates && <text x={center.x} y={center.y + 13} className="hex-coordinate">q{cell.q}, r{cell.r}</text>}
                {settings.edgeLabels && EDGES.map((edge) => {
                  const point = edgePosition(center.x, center.y, settings.radius, edge);
                  return <text key={edge} x={point.x} y={point.y + 3} className="edge-label">{edge}</text>;
                })}
                {settings.arrows && (() => {
                  const visibleExits = DIRECTIONS.flatMap(({ id }) => {
                    const exit = cell.exits[id];
                    return exit ? [{ id, exit }] : [];
                  });

                  return visibleExits.map(({ id, exit }) => {
                    const sameEdge = visibleExits.filter((candidate) => candidate.exit.edge === exit.edge);
                    const laneIndex = sameEdge.findIndex((candidate) => candidate.id === id);
                    const laneOffset = (laneIndex - (sameEdge.length - 1) / 2) * 9;
                    const angle = (EDGE_ANGLES[exit.edge] * Math.PI) / 180;
                    const offsetX = -Math.sin(angle) * laneOffset;
                    const offsetY = Math.cos(angle) * laneOffset;
                    const start = edgePosition(center.x, center.y, settings.radius, exit.edge, 0.46);
                    const end = edgePosition(center.x, center.y, settings.radius, exit.edge, 0.72);
                    return (
                      <line
                        key={id}
                        x1={start.x + offsetX}
                        y1={start.y + offsetY}
                        x2={end.x + offsetX}
                        y2={end.y + offsetY}
                        className={`exit-arrow exit-arrow--${id}`}
                        markerEnd={`url(#arrow${id[0].toUpperCase()}${id.slice(1)})`}
                      />
                    );
                  });
                })()}
              </g>
            );
          })}
        </g>
      )}

      <g className="map-compass" transform="translate(1100 1090)">
        <circle r="48" />
        <path d="M0-39 8-8 0 0-8-8Z M39 0 8 8 0 0 8-8Z M0 39-8 8 0 0 8 8Z M-39 0-8-8 0 0-8 8Z" />
        <text y="-54">N</text>
      </g>
    </svg>
  );
}

export function App() {
  const [productMode, setProductMode] = useState<"play" | "workbench">("play");
  const [cells, setCells] = useState(cloneCells);
  const [settings, setSettings] = useState(initialSettings);
  const [activeId, setActiveId] = useState("H30");
  const [referenceUrl, setReferenceUrl] = useState<string | null>("/reference/long-journey-board.png");
  const [referenceName, setReferenceName] = useState<string | null>("Long Journey board photo");
  const [panel, setPanel] = useState<"inspector" | "table">("inspector");
  const [viewMode, setViewMode] = useState<"clean" | "audit">("clean");
  const uploadRef = useRef<HTMLInputElement>(null);

  const active = cells.find((cell) => cell.id === activeId) ?? cells[0];
  const verifiedCount = cells.filter((cell) => cell.verified).length;
  const exitCount = cells.reduce((count, cell) => count + Object.keys(cell.exits).length, 0);

  useEffect(() => () => {
    if (referenceUrl?.startsWith("blob:")) URL.revokeObjectURL(referenceUrl);
  }, [referenceUrl]);

  const setSetting = <K extends keyof AuditSettings>(key: K, value: AuditSettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const updateActive = (updater: (cell: HexCell) => HexCell) => {
    setCells((current) => current.map((cell) => (cell.id === activeId ? updater(cell) : cell)));
  };

  const updateExit = (direction: Direction, edge: Edge | "") => {
    updateActive((cell) => {
      const exits = { ...cell.exits };
      if (!edge) delete exits[direction];
      else exits[direction] = { edge, to: "UNVERIFIED", verified: false, note: "Target requires reference-photo audit." };
      return { ...cell, exits, verified: false };
    });
  };

  const updateExitTarget = (direction: Direction, to: string) => {
    updateActive((cell) => {
      const exit = cell.exits[direction];
      if (!exit) return cell;
      return { ...cell, exits: { ...cell.exits, [direction]: { ...exit, to, verified: false } }, verified: false };
    });
  };

  const exportAudit = () => {
    const payload = { ...longJourney, cells, verified: cells.length > 0 && cells.every((cell) => cell.verified) };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "long-journey-audit.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const tableRows = useMemo(() => cells.map((cell) => ({
    ...cell,
    exitSummary: DIRECTIONS.map(({ id }) => cell.exits[id] ? `${id[0].toUpperCase()}: ${cell.exits[id]!.edge}→${cell.exits[id]!.to}` : `${id[0].toUpperCase()}: —`).join(" · "),
  })), [cells]);

  if (productMode === "play") {
    return <GamePrototype onOpenWorkbench={() => setProductMode("workbench")} />;
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-mark" aria-hidden="true"><span>☠</span></div>
        <div className="brand-copy">
          <p>Feed the Kraken · Engineering Workbench</p>
          <h1>Long Journey <em>Living Map</em></h1>
        </div>
        <div className="topbar__status">
          <span className="status-dot" />
          <div><strong>Milestone 02</strong><small>Clean board art</small></div>
        </div>
        <button className="button button--ghost" onClick={() => setProductMode("play")}>Play prototype</button>
        <button className="button button--primary" onClick={exportAudit}>Export audit JSON <span>↗</span></button>
      </header>

      <section className="notice-bar">
        <span className="notice-icon">!</span>
        <p><strong>Clean board active.</strong> The surface is drawn from map data; the source photo is only available in Audit mode.</p>
        <span className="notice-pill">31 cells · live vector map</span>
      </section>

      <div className="workspace">
        <aside className="control-panel">
          <div className="panel-heading">
            <span>{viewMode === "clean" ? "Board controls" : "Overlay controls"}</span>
            <kbd>{viewMode === "clean" ? "LIVE" : "DEBUG"}</kbd>
          </div>

          <div className="view-mode-toggle" aria-label="Map view mode">
            <button className={viewMode === "clean" ? "is-active" : ""} onClick={() => setViewMode("clean")}><b>Clean Board</b><small>New vector artwork</small></button>
            <button className={viewMode === "audit" ? "is-active" : ""} onClick={() => setViewMode("audit")}><b>Audit</b><small>Source photo overlay</small></button>
          </div>

          {viewMode === "audit" && <button className="upload-card" onClick={() => uploadRef.current?.click()}>
            <span className="upload-card__icon">⌁</span>
            <span><strong>{referenceName ?? "Load reference photo"}</strong><small>{referenceName ? "Stored in this browser session only" : "PNG, JPG or WEBP · local only"}</small></span>
            <span className="upload-card__action">Browse</span>
          </button>}
          <input ref={uploadRef} hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            if (referenceUrl?.startsWith("blob:")) URL.revokeObjectURL(referenceUrl);
            setReferenceUrl(URL.createObjectURL(file));
            setReferenceName(file.name);
          }} />

          <div className="control-group">
            {viewMode === "audit" && <ControlSwitch label="Debug hex overlay" checked={settings.overlay} onChange={(value) => setSetting("overlay", value)} />}
            <ControlSwitch label={viewMode === "clean" ? "Cell IDs" : "Axial coordinates"} checked={settings.coordinates} onChange={(value) => setSetting("coordinates", value)} />
            {viewMode === "audit" && <ControlSwitch label="Six edge positions" checked={settings.edgeLabels} onChange={(value) => setSetting("edgeLabels", value)} />}
            <ControlSwitch label="Movement arrows" checked={settings.arrows} onChange={(value) => setSetting("arrows", value)} />
            {viewMode === "clean" && <ControlSwitch label="Water & token animation" checked={settings.animations} onChange={(value) => setSetting("animations", value)} />}
          </div>

          {viewMode === "audit" && <div className="slider-group">
            <label><span>Reference opacity</span><output>{settings.referenceOpacity}%</output></label>
            <input type="range" min="0" max="100" value={settings.referenceOpacity} onChange={(event) => setSetting("referenceOpacity", Number(event.target.value))} />
            <label><span>Grid opacity</span><output>{settings.gridOpacity}%</output></label>
            <input type="range" min="10" max="100" value={settings.gridOpacity} onChange={(event) => setSetting("gridOpacity", Number(event.target.value))} />
          </div>}

          {viewMode === "audit" && <div className="numeric-grid">
            <label>Radius<input type="number" min="28" max="110" value={settings.radius} onChange={(event) => setSetting("radius", Number(event.target.value))} /></label>
            <label>Origin X<input type="number" value={settings.originX} onChange={(event) => setSetting("originX", Number(event.target.value))} /></label>
            <label>Origin Y<input type="number" value={settings.originY} onChange={(event) => setSetting("originY", Number(event.target.value))} /></label>
          </div>}
          {viewMode === "audit" && <button className="button button--ghost button--wide" onClick={() => setSettings(initialSettings)}>Reset alignment</button>}

          {viewMode === "clean" && <div className="art-note"><strong>100% redrawn</strong><span>No photo tiles underneath. Grid, sea, coast, icons and routes are independent vector layers.</span></div>}

          <div className="legend">
            <span className="legend__title">Exit legend</span>
            <span><i className="swatch swatch--red" /> Red / West</span>
            <span><i className="swatch swatch--blue" /> Blue / East</span>
            <span><i className="swatch swatch--yellow" /> Yellow / North</span>
          </div>
        </aside>

        <section className="map-stage">
          <div className="map-stage__header">
            <div><span className="eyebrow">Map surface</span><h2>{viewMode === "clean" ? "Long Journey · illustrated board" : "Axial calibration field"}</h2></div>
            <div className="map-stage__stats"><span><b>{cells.length}</b> staging cells</span><span><b>{exitCount}</b> exits entered</span><span><b>{verifiedCount}</b> verified</span></div>
          </div>
          <div className="map-frame">
            {viewMode === "clean" ? (
              <CleanMap cells={cells} activeId={activeId} onSelect={setActiveId} showArrows={settings.arrows} showLabels={settings.coordinates} animate={settings.animations} />
            ) : (
              <MapCanvas cells={cells} settings={settings} activeId={activeId} onSelect={setActiveId} referenceUrl={referenceUrl} />
            )}
            <div className="map-badge"><span>Flat-top</span><b>x = 1.5Rq</b><b>y = √3R(r + q/2)</b></div>
            <div className="zoom-note">Click any hex to inspect · {viewMode === "clean" ? "vector board" : "reference never uploads"}</div>
          </div>
        </section>

        <aside className="audit-panel">
          <div className="tabs">
            <button className={panel === "inspector" ? "is-active" : ""} onClick={() => setPanel("inspector")}>Cell inspector</button>
            <button className={panel === "table" ? "is-active" : ""} onClick={() => setPanel("table")}>Coordinate table</button>
          </div>

          {panel === "inspector" ? (
            <div className="inspector">
              <div className="selected-cell">
                <div><span>Selected hex</span><strong>{active.id}</strong></div>
                <span className="verification-state">{active.verified ? "Photo-audited" : "Needs review"}</span>
              </div>
              <div className="coordinate-pair"><div><small>Axial q</small><b>{active.q}</b></div><div><small>Axial r</small><b>{active.r}</b></div></div>

              <div className="inspector-section">
                <div className="section-title"><span>Navigation exits</span><small>Reference required</small></div>
                {DIRECTIONS.map(({ id, label }) => (
                  <div className={`exit-editor exit-editor--${id}`} key={id}>
                    <span className="exit-editor__dot" />
                    <label><small>{label}</small><select value={active.exits[id]?.edge ?? ""} onChange={(event) => updateExit(id, event.target.value as Edge | "")}><option value="">No audited edge</option>{EDGES.map((edge) => <option value={edge} key={edge}>{edge} edge</option>)}</select></label>
                    <label><small>Target</small><select disabled={!active.exits[id]} value={active.exits[id]?.to ?? ""} onChange={(event) => updateExitTarget(id, event.target.value)}><option value="UNVERIFIED">Unverified</option>{cells.filter((cell) => cell.id !== active.id).map((cell) => <option value={cell.id} key={cell.id}>{cell.id}</option>)}</select></label>
                  </div>
                ))}
              </div>

              <div className="inspector-section">
                <div className="section-title"><span>Cell metadata</span></div>
                <label className="field-label">Special action<select value={active.action ?? ""} onChange={(event) => updateActive((cell) => ({ ...cell, action: (event.target.value || null) as HexCell["action"], verified: false }))}><option value="">None / unverified</option><option value="CABIN_SEARCH">Cabin Search</option><option value="FLOGGING">Flogging</option><option value="OFF_WITH_THE_TONGUE">Off With The Tongue</option><option value="FEED_THE_KRAKEN">Feed the Kraken</option></select></label>
                <label className="field-label">Victory region<select value={active.type} onChange={(event) => updateActive((cell) => ({ ...cell, type: event.target.value as HexCell["type"], verified: false }))}><option value="normal">Normal / unverified</option><option value="sailor_victory">Sailor</option><option value="pirate_victory">Pirate</option><option value="cult_victory">Cult / Kraken</option></select></label>
                <label className="field-label">Audit note<textarea value={active.note ?? ""} onChange={(event) => updateActive((cell) => ({ ...cell, note: event.target.value }))} /></label>
              </div>

              <label className={`verify-check ${!referenceUrl ? "is-disabled" : ""}`}><input type="checkbox" disabled={!referenceUrl} checked={active.verified} onChange={(event) => updateActive((cell) => ({ ...cell, verified: event.target.checked }))} /><span><strong>Mark cell visually verified</strong><small>{referenceUrl ? "Only after checking all six edges" : "Load a reference photo first"}</small></span></label>
            </div>
          ) : (
            <div className="table-panel">
              <p>First visual audit from the supplied board photo. Banner-obscured cells remain unverified until you approve them.</p>
              <div className="coordinate-table" role="table">
                {tableRows.map((row) => <button key={row.id} onClick={() => { setActiveId(row.id); setPanel("inspector"); }}><span><b>{row.id}</b><small>q {row.q}, r {row.r}</small></span><em>{row.exitSummary}</em><i>{row.verified ? "✓" : "?"}</i></button>)}
              </div>
            </div>
          )}

          <div className="audit-footer">
            <Metric value={`${verifiedCount}/${cells.length}`} label="cells verified" tone={verifiedCount ? "good" : "warn"} />
            <Metric value={exitCount} label="exits entered" />
          </div>
        </aside>
      </div>
    </main>
  );
}
