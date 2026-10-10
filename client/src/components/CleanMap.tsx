import { axialToPixel, hexPoints } from "@server/data/maps/hexGeometry";
import type { Direction, Edge, HexCell } from "@shared/types";

const DIRECTIONS: Array<{ id: Direction; color: string }> = [
  { id: "red", color: "#f36e5f" },
  { id: "blue", color: "#62c7f2" },
  { id: "yellow", color: "#f6d45e" },
];

const EDGE_ANGLES: Record<Edge, number> = {
  NE: -90,
  E: -30,
  SE: 30,
  SW: 90,
  W: 150,
  NW: 210,
};

const ACTION_LABELS: Record<NonNullable<HexCell["action"]>, string> = {
  CABIN_SEARCH: "Cabin Search",
  FLOGGING: "Flogging",
  OFF_WITH_THE_TONGUE: "Off With the Tongue",
  FEED_THE_KRAKEN: "Feed the Kraken",
};

function edgePosition(x: number, y: number, radius: number, edge: Edge, multiplier = 0.82) {
  const angle = (EDGE_ANGLES[edge] * Math.PI) / 180;
  return { x: x + Math.cos(angle) * radius * multiplier, y: y + Math.sin(angle) * radius * multiplier };
}

function edgeSegment(x: number, y: number, radius: number, edge: Edge) {
  const angle = (EDGE_ANGLES[edge] * Math.PI) / 180;
  const tangentX = -Math.sin(angle);
  const tangentY = Math.cos(angle);
  const edgeX = x + Math.cos(angle) * radius * 0.84;
  const edgeY = y + Math.sin(angle) * radius * 0.84;
  return {
    x1: edgeX - tangentX * radius * 0.47,
    y1: edgeY - tangentY * radius * 0.47,
    x2: edgeX + tangentX * radius * 0.47,
    y2: edgeY + tangentY * radius * 0.47,
  };
}

function cellTone(cell: HexCell) {
  if (cell.type === "pirate_victory") return "pirate";
  if (cell.type === "sailor_victory") return "sailor";
  if (cell.type === "cult_victory") return "cult";
  if (cell.r >= 1) return "shallows";
  return "deep";
}

function ActionIcon({ action }: { action: NonNullable<HexCell["action"]> }) {
  const crop: Record<NonNullable<HexCell["action"]>, [number, number]> = {
    CABIN_SEARCH: [0, 0],
    FLOGGING: [640, 0],
    OFF_WITH_THE_TONGUE: [0, 640],
    FEED_THE_KRAKEN: [640, 640],
  };
  const [x, y] = crop[action];

  return (
    <svg x="-53" y="-53" width="106" height="106" viewBox={`${x} ${y} 640 640`} overflow="hidden" aria-hidden="true">
      <image href="/art/components/map-actions-atlas-v2.png" width="1280" height="1280" preserveAspectRatio="none" />
    </svg>
  );
}

function ShipIcon({ x, y }: { x: number; y: number }) {
  return (
    <g className="clean-ship" transform={`translate(${x} ${y})`}>
      <ellipse cy="33" rx="31" ry="9" className="clean-ship__shadow" />
      <image href="/art/components/ship-map-token-v2.png" x="-39" y="-52" width="78" height="98" preserveAspectRatio="xMidYMid meet" />
    </g>
  );
}

export function CleanMap({
  cells,
  activeId,
  onSelect,
  showArrows,
  showLabels,
  animate,
  shipHexId = "H30",
}: {
  cells: HexCell[];
  activeId: string;
  onSelect: (id: string) => void;
  showArrows: boolean;
  showLabels: boolean;
  animate: boolean;
  shipHexId?: string;
}) {
  const radius = 96;
  const originX = 600;
  const originY = 600;
  const shipCell = cells.find((cell) => cell.id === shipHexId) ?? cells.find((cell) => cell.id === "H30") ?? cells[0];
  const shipCenter = axialToPixel(shipCell.q, shipCell.r, radius, originX, originY);

  return (
    <svg className={`map-svg clean-map ${animate ? "is-animated" : ""}`} viewBox="0 0 1200 1200" role="img" aria-label="Long Journey clean illustrated game map">
      <defs>
        <linearGradient id="cleanSea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#132b38" />
          <stop offset=".48" stopColor="#244b59" />
          <stop offset="1" stopColor="#668f8b" />
        </linearGradient>
        <radialGradient id="cleanVignette" cx="50%" cy="48%" r="72%">
          <stop offset="48%" stopColor="#b9f0e8" stopOpacity="0" />
          <stop offset="100%" stopColor="#031b27" stopOpacity=".78" />
        </radialGradient>
        <linearGradient id="deepCell" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#345d68" /><stop offset="1" stopColor="#183b4b" /></linearGradient>
        <linearGradient id="shallowCell" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#91aaa0" /><stop offset="1" stopColor="#527c7b" /></linearGradient>
        <linearGradient id="pirateCell" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#80514d" /><stop offset="1" stopColor="#49363d" /></linearGradient>
        <linearGradient id="sailorCell" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#4d7082" /><stop offset="1" stopColor="#2d4c61" /></linearGradient>
        <linearGradient id="cultCell" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#8b8058" /><stop offset="1" stopColor="#4b5543" /></linearGradient>
        <radialGradient id="tokenFace"><stop offset="0" stopColor="#eee2bd" /><stop offset=".65" stopColor="#b49b63" /><stop offset="1" stopColor="#66502d" /></radialGradient>
        <pattern id="cleanWaves" width="90" height="52" patternUnits="userSpaceOnUse">
          <path d="M-30 26Q-8 6 14 26t44 0t44 0" fill="none" stroke="#e7ffff" strokeOpacity=".12" strokeWidth="2" />
          <path d="M4 45q14-12 28 0" fill="none" stroke="#e7ffff" strokeOpacity=".08" strokeWidth="1.5" />
        </pattern>
        <filter id="cleanHexShadow" x="-25%" y="-25%" width="150%" height="160%"><feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#001b2a" floodOpacity=".48" /></filter>
        <filter id="cleanTokenShadow" x="-60%" y="-60%" width="220%" height="240%"><feDropShadow dx="0" dy="8" stdDeviation="5" floodColor="#00141e" floodOpacity=".7" /></filter>
        <filter id="cleanGlow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="7" result="b" /><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="paintedGrain" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency=".027 .06" numOctaves="3" seed="19" result="grain" />
          <feColorMatrix in="grain" values=".8 0 0 0 .15  0 .8 0 0 .14  0 0 .7 0 .12  0 0 0 .42 0" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
        <filter id="roughInk" x="-8%" y="-8%" width="116%" height="116%">
          <feTurbulence type="fractalNoise" baseFrequency=".018" numOctaves="2" seed="7" result="wobble" />
          <feDisplacementMap in="SourceGraphic" in2="wobble" scale="2.8" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        {DIRECTIONS.map(({ id, color }) => (
          <marker key={id} id={`cleanArrow-${id}`} viewBox="0 0 12 12" refX="9" refY="6" markerWidth="7" markerHeight="7" orient="auto"><path d="M1 1 11 6 1 11 4 6Z" fill={color} stroke="#092838" strokeWidth=".7" /></marker>
        ))}
        {cells.map((cell) => {
          const center = axialToPixel(cell.q, cell.r, radius, originX, originY);
          return <clipPath id={`cell-clip-${cell.id}`} key={`clip-${cell.id}`}><polygon points={hexPoints(center.x, center.y, radius - 5)} /></clipPath>;
        })}
      </defs>

      <rect width="1200" height="1200" fill="url(#cleanSea)" />
      <image href="/art/long-journey-world-v4.png" width="1200" height="1200" preserveAspectRatio="xMidYMid slice" className="clean-world-background" />
      <image href="/art/central-island-v4.png" x="505" y="588" width="190" height="190" preserveAspectRatio="xMidYMid meet" className="clean-central-island" />
      <rect width="1200" height="1200" fill="url(#cleanVignette)" pointerEvents="none" />

      <g className="clean-grid">
        {cells.map((cell) => {
          const center = axialToPixel(cell.q, cell.r, radius, originX, originY);
          const active = cell.id === activeId;
          const exits = DIRECTIONS.flatMap(({ id }) => cell.exits[id] ? [{ id, exit: cell.exits[id]! }] : []);
          return (
            <g
              key={cell.id}
              className={`clean-cell clean-cell--${cellTone(cell)} ${active ? "is-active" : ""}`}
              onClick={() => onSelect(cell.id)}
              onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && onSelect(cell.id)}
              role="button"
              tabIndex={0}
              aria-label={`${cell.id}${cell.action ? `, ${ACTION_LABELS[cell.action]}` : ""}`}
            >
              <polygon className="clean-cell__surface" points={hexPoints(center.x, center.y, radius - 1)} filter={active ? "url(#cleanHexShadow)" : undefined} />
              <polygon className="clean-cell__ink" points={hexPoints(center.x, center.y, radius - 3)} />

              {Array.from(new Set(exits.filter(({ exit }) => exit.crossesSupplyLine).map(({ exit }) => exit.edge))).map((edge) => {
                const segment = edgeSegment(center.x, center.y, radius, edge);
                return <line key={`supply-${edge}`} {...segment} className="clean-supply-line" />;
              })}

              {showArrows && exits.map(({ id, exit }) => {
                const sameEdge = exits.filter((candidate) => candidate.exit.edge === exit.edge);
                const laneIndex = sameEdge.findIndex((candidate) => candidate.id === id);
                const laneOffset = (laneIndex - (sameEdge.length - 1) / 2) * 11;
                const angle = (EDGE_ANGLES[exit.edge] * Math.PI) / 180;
                const offsetX = -Math.sin(angle) * laneOffset;
                const offsetY = Math.cos(angle) * laneOffset;
                const start = edgePosition(center.x, center.y, radius, exit.edge, 0.61);
                const end = edgePosition(center.x, center.y, radius, exit.edge, 0.76);
                return <line key={id} x1={start.x + offsetX} y1={start.y + offsetY} x2={end.x + offsetX} y2={end.y + offsetY} className={`clean-arrow clean-arrow--${id}`} markerEnd={`url(#cleanArrow-${id})`} />;
              })}

              {cell.action && cell.action !== "FEED_THE_KRAKEN" && (
                <g className="clean-token" transform={`translate(${center.x} ${center.y - 8})`}>
                  <ActionIcon action={cell.action} />
                  <text y="51" className="clean-token__label">{ACTION_LABELS[cell.action]}</text>
                </g>
              )}

              {showLabels && <text x={center.x} y={center.y + (cell.action || cell.type !== "normal" ? 55 : 6)} className="clean-cell__id">{cell.id}</text>}
            </g>
          );
        })}
      </g>

      <g className="clean-cannon-line">
        <path d="M174 570 267 686" />
        <path d="M933 686 1007 570" />
      </g>

      <g className="clean-zone-label clean-zone-label--pirate"><text x="145" y="322">PIRATE WATERS</text><path d="M56 334h180" /></g>
      <g className="clean-zone-label clean-zone-label--cult"><text x="600" y="72">THE KRAKEN</text><path d="M522 83h156" /></g>
      <g className="clean-zone-label clean-zone-label--sailor"><text x="1055" y="322">SAFE WATERS</text><path d="M966 334h180" /></g>
      <ShipIcon x={shipCenter.x} y={shipCenter.y} />

      <g className="clean-compass" transform="translate(1080 1075)"><circle r="56"/><path d="M0-44 9-8 0 0-9-8ZM44 0 8 9 0 0 8-9ZM0 44-9 8 0 0 9 8ZM-44 0-8-9 0 0-8 9Z"/><text y="-63">N</text></g>
    </svg>
  );
}
