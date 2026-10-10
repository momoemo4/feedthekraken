import type { Edge } from "../../../shared/types";

export const EDGE_DELTAS: Record<Edge, { q: number; r: number }> = {
  NW: { q: -1, r: 0 },
  NE: { q: 0, r: -1 },
  E: { q: 1, r: -1 },
  SE: { q: 1, r: 0 },
  SW: { q: 0, r: 1 },
  W: { q: -1, r: 1 },
};

export function axialToPixel(q: number, r: number, radius: number, originX = 0, originY = 0) {
  return {
    x: originX + 1.5 * radius * q,
    y: originY + Math.sqrt(3) * radius * (r + q / 2),
  };
}

export function hexPoints(centerX: number, centerY: number, radius: number): string {
  return Array.from({ length: 6 }, (_, index) => {
    const angle = (Math.PI / 180) * (60 * index);
    return `${centerX + radius * Math.cos(angle)},${centerY + radius * Math.sin(angle)}`;
  }).join(" ");
}

export function neighborCoordinate(q: number, r: number, edge: Edge) {
  const delta = EDGE_DELTAS[edge];
  return { q: q + delta.q, r: r + delta.r };
}
