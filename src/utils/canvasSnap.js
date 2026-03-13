/**
 * Canvas snap utilities for console-style layout.
 * Modules snap to a grid and edge-to-edge to other modules so they form one console.
 * All positions are "offset from viewport center" (same as App state).
 */

export const GRID_SIZE = 24;
/** When a module is within this many px of another's edge, it snaps (attaches) to that edge */
export const SNAP_THRESHOLD = 28;
/** Gap between modules when snapped: 0 = flush (one surface), 2 = minimal seam */
export const WIDGET_GAP = 0;

/**
 * Snap a single coordinate to the nearest grid line.
 */
export function snapToGridAxis(value) {
  const n = Math.round(value / GRID_SIZE);
  return n * GRID_SIZE;
}

/**
 * Snap (x, y) to the grid.
 */
export function snapToGrid(x, y) {
  return {
    x: snapToGridAxis(x),
    y: snapToGridAxis(y),
  };
}

/**
 * Compute candidate positions for snapping the dragged widget to others.
 * Each candidate is { x, y } (center position) that would align one edge of
 * the dragged widget with an edge of another widget (with GAP).
 *
 * @param {{ x: number, y: number }} pos - current center of dragged widget
 * @param {{ width: number, height: number }} size - size of dragged widget
 * @param {{ x: number, y: number, width: number, height: number }[]} others - other widgets (center + size)
 */
function getWidgetSnapCandidates(pos, size, others) {
  const candidates = [];
  const w = size.width;
  const h = size.height;
  const hw = w / 2;
  const hh = h / 2;

  for (const o of others) {
    const ow = o.width;
    const oh = o.height;
    const ohw = ow / 2;
    const ohh = oh / 2;

    // Align our left to their right + GAP  => our center x = their center x + ohw + GAP + hw
    candidates.push({ x: o.x + ohw + WIDGET_GAP + hw, y: pos.y });
    // Align our right to their left - GAP  => our center x = their center x - ohw - GAP - hw
    candidates.push({ x: o.x - ohw - WIDGET_GAP - hw, y: pos.y });
    // Align our top to their bottom + GAP  => our center y = their center y + ohh + GAP + hh
    candidates.push({ x: pos.x, y: o.y + ohh + WIDGET_GAP + hh });
    // Align our bottom to their top - GAP   => our center y = their center y - ohh - GAP - hh
    candidates.push({ x: pos.x, y: o.y - ohh - WIDGET_GAP - hh });

    // Corner-style: align both axes (e.g. our left to their right AND our top to their top)
    candidates.push({ x: o.x + ohw + WIDGET_GAP + hw, y: o.y });
    candidates.push({ x: o.x - ohw - WIDGET_GAP - hw, y: o.y });
    candidates.push({ x: o.x, y: o.y + ohh + WIDGET_GAP + hh });
    candidates.push({ x: o.x, y: o.y - ohh - WIDGET_GAP - hh });
  }

  return candidates;
}

/**
 * Find the best snapped position: either to grid or to another widget,
 * whichever is within SNAP_THRESHOLD and closest to the current position.
 *
 * @param {{ x: number, y: number }} pos - current center of dragged widget
 * @param {{ width: number, height: number }} size - size of dragged widget
 * @param {{ x: number, y: number, width: number, height: number }[]} otherWidgets - other widgets (center + size)
 * @returns {{ x: number, y: number }} - snapped position
 */
export function getSnappedPosition(pos, size, otherWidgets) {
  const gridSnap = snapToGrid(pos.x, pos.y);
  const candidates = [
    { x: gridSnap.x, y: gridSnap.y },
    ...getWidgetSnapCandidates(pos, size, otherWidgets),
  ];

  // Start with grid as default so we always snap at least to the grid
  let best = { x: gridSnap.x, y: gridSnap.y };
  let bestDist = Math.hypot(gridSnap.x - pos.x, gridSnap.y - pos.y);
  const threshold = SNAP_THRESHOLD;

  for (const c of candidates) {
    const dist = Math.hypot(c.x - pos.x, c.y - pos.y);
    if (dist <= threshold && dist < bestDist) {
      bestDist = dist;
      best = { x: c.x, y: c.y };
    }
  }

  return best;
}
