const GET = '/__macos/get-volume';
const SET = '/__macos/set-volume';

function canUseBridge() {
  return import.meta.env.DEV === true;
}

/** Read macOS output volume (0–1) when the Vite macOS bridge is running. */
export async function pullMacOsOutputVolume() {
  if (!canUseBridge()) return null;
  try {
    const r = await fetch(GET);
    if (!r.ok) return null;
    const j = await r.json();
    const v = Number(j.volume);
    if (Number.isNaN(v)) return null;
    return Math.max(0, Math.min(1, v));
  } catch {
    return null;
  }
}

/** Push normalized volume to macOS output volume when the Vite macOS bridge is running. */
export async function pushMacOsOutputVolume(volume01) {
  if (!canUseBridge()) return;
  const v = Math.max(0, Math.min(1, volume01));
  try {
    await fetch(SET, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ volume: v }),
    });
  } catch {
    /* bridge offline or not on macOS */
  }
}
