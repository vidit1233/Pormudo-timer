/**
 * macOS output volume HUD uses 16 quantized positions. This app matches that step count.
 *
 * Tick arc: clockwise from 12 o’clock, starting at 225° (≈7:30), passing over the top through
 * midnight, ending at 135° (≈4:30) — 270° sweep on the upper part of the dial. The bottom
 * crescent (between 135° and 225° the short way) has no ticks.
 */

export const MAC_OUTPUT_VOLUME_STEPS = 16;

/** Step 0 (min volume) sits here; we move clockwise along the arc toward STEP_LAST_DEG. */
export const VOLUME_ARC_STEP0_DEG = 225;
/** Step n−1 (max volume) after sweeping 270° clockwise from STEP0. */
export const VOLUME_ARC_STEP_LAST_DEG = 135;
/** Total clockwise travel from first tick to last (over the top of the dial). */
export const VOLUME_ARC_SWEEP_CW_DEG = 270;

export function snapVolumeToSteps(v) {
  const n = MAC_OUTPUT_VOLUME_STEPS - 1;
  const step = Math.round(Math.max(0, Math.min(1, Number(v))) * n);
  return step / n;
}

export function volumeStepIndex(volume01) {
  const n = MAC_OUTPUT_VOLUME_STEPS - 1;
  return Math.round(Math.max(0, Math.min(1, volume01)) * n);
}

/** Clockwise-from-top angle (deg) for this step index on the active arc (equally spaced). */
export function stepAngleClockwiseFromTop(stepIndex) {
  const n = MAC_OUTPUT_VOLUME_STEPS - 1;
  const i = Math.max(0, Math.min(n, stepIndex));
  let u = VOLUME_ARC_STEP0_DEG + (i / n) * VOLUME_ARC_SWEEP_CW_DEG;
  while (u >= 360) u -= 360;
  return u;
}

/** CSS rotate (positive = clockwise); indicator is at 12 o’clock on the knob element. */
export function knobRotationCssDeg(stepIndex) {
  return stepAngleClockwiseFromTop(stepIndex);
}

/**
 * Point on the volume arc at given radius (SVG: center origin, +y down).
 * Angle U = clockwise from 12 o’clock.
 */
export function tickPositionOnArc(stepIndex, radius) {
  const U = stepAngleClockwiseFromTop(stepIndex);
  const u = (U * Math.PI) / 180;
  return {
    x: radius * Math.sin(u),
    y: -radius * Math.cos(u),
  };
}

/** Pointer angle clockwise from 12 o’clock (screen coords, y down). */
export function pointerAngleCwFromTopDeg(clientX, clientY, cx, cy) {
  const dx = clientX - cx;
  const dy = clientY - cy;
  if (dx === 0 && dy === 0) return VOLUME_ARC_STEP0_DEG;
  let u = (Math.atan2(dx, -dy) * 180) / Math.PI;
  if (u < 0) u += 360;
  return u;
}

/**
 * Map pointer angle to nearest step. Bottom gap (strictly between 135° and 225°) snaps to the
 * closer arc endpoint; the active arc is u ≥ 225 or u ≤ 135.
 */
export function stepIndexFromPointerAngleCwFromTop(deg) {
  const n = MAC_OUTPUT_VOLUME_STEPS - 1;
  let u = deg;
  while (u < 0) u += 360;
  while (u >= 360) u -= 360;

  if (u > 135 && u < 225) {
    u = u - 135 <= 225 - u ? 135 : 225;
  }

  let t;
  if (u >= 225) {
    t = (u - 225) / VOLUME_ARC_SWEEP_CW_DEG;
  } else {
    t = (u + 135) / VOLUME_ARC_SWEEP_CW_DEG;
  }

  t = Math.max(0, Math.min(1, t));
  return Math.round(t * n);
}
