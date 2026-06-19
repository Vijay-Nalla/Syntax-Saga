// Scene guard: detects when the in-game canvas fails to render and notifies listeners.
// Pure functions — no React state. The Index page mounts a watcher and shows a recovery overlay.

type FailureReason = "scene_timeout" | "canvas_missing" | "render_error" | "asset_failure" | "network_failure" | "websocket_failure";

export interface SceneFailureEvent {
  reason: FailureReason;
  message: string;
  ts: number;
}

type Listener = (e: SceneFailureEvent) => void;

const listeners = new Set<Listener>();
let lastFailure: SceneFailureEvent | null = null;

export function onSceneFailure(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function reportSceneFailure(reason: FailureReason, message = "") {
  const ev: SceneFailureEvent = { reason, message, ts: Date.now() };
  lastFailure = ev;
  listeners.forEach((l) => { try { l(ev); } catch { /* ignore */ } });
}

export function getLastFailure() { return lastFailure; }
export function clearFailure() { lastFailure = null; }

/**
 * Heartbeat: when the user enters in-game phase, we expect the canvas to paint within `timeoutMs`.
 * If not, we report a scene_timeout failure so the recovery overlay can take over.
 */
export function startSceneHeartbeat(canvas: HTMLCanvasElement | null, timeoutMs = 5000): () => void {
  let cancelled = false;
  const timer = window.setTimeout(() => {
    if (cancelled) return;
    if (!canvas) {
      reportSceneFailure("canvas_missing", "Canvas element not mounted in time");
      return;
    }
    try {
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reportSceneFailure("render_error", "2D context unavailable");
        return;
      }
      // Sample a pixel near the centre — if it is fully transparent/black, the engine never painted.
      const sample = ctx.getImageData(canvas.width / 2 | 0, canvas.height / 2 | 0, 1, 1).data;
      const isBlank = sample[3] === 0 || (sample[0] === 0 && sample[1] === 0 && sample[2] === 0 && sample[3] !== 0);
      if (isBlank) reportSceneFailure("scene_timeout", "Scene did not paint within timeout window");
    } catch (err) {
      reportSceneFailure("render_error", String(err));
    }
  }, timeoutMs);
  return () => { cancelled = true; clearTimeout(timer); };
}
