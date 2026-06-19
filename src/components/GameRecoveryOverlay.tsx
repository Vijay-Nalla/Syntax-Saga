import { useEffect, useState } from "react";
import { onSceneFailure, clearFailure, type SceneFailureEvent } from "@/game/sceneGuard";

interface Props {
  onRetry: () => void;
  onReturnHome: () => void;
}

const REASON_LABEL: Record<string, string> = {
  scene_timeout: "Scene rendering timeout",
  canvas_missing: "Canvas not mounted",
  render_error: "Renderer error",
  asset_failure: "Asset failed to load",
  network_failure: "Network unreachable",
  websocket_failure: "Multiplayer connection lost",
};

export default function GameRecoveryOverlay({ onRetry, onReturnHome }: Props) {
  const [failure, setFailure] = useState<SceneFailureEvent | null>(null);
  const [progress, setProgress] = useState(0);
  const [autoRetried, setAutoRetried] = useState(false);

  useEffect(() => onSceneFailure((e) => { setFailure(e); setProgress(0); setAutoRetried(false); }), []);

  useEffect(() => {
    if (!failure) return;
    const t = setInterval(() => setProgress((p) => Math.min(p + 7, 100)), 120);
    return () => clearInterval(t);
  }, [failure]);

  useEffect(() => {
    if (!failure || autoRetried) return;
    const t = setTimeout(() => { setAutoRetried(true); clearFailure(); setFailure(null); onRetry(); }, 2500);
    return () => clearTimeout(t);
  }, [failure, autoRetried, onRetry]);

  if (!failure) return null;
  const showButtons = autoRetried;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur">
      <div className="absolute inset-0 scanlines pointer-events-none" />
      <div className="relative z-10 w-full max-w-md mx-4 border-2 border-primary rounded-lg bg-card/90 p-6 box-glow-primary">
        <p className="font-pixel text-sm text-primary text-glow-primary text-center mb-2 animate-pulse">RECOVERING GAME SESSION…</p>
        <p className="font-mono text-[10px] text-muted-foreground text-center mb-4">{REASON_LABEL[failure.reason] || failure.reason}</p>

        <div className="w-full h-2 bg-muted/40 rounded overflow-hidden mb-4">
          <div className="h-full bg-gradient-to-r from-primary to-secondary transition-all" style={{ width: `${progress}%` }} />
        </div>

        <div className="space-y-1 mb-4 text-[10px] font-mono">
          <DiagRow label="Asset loader" ok={failure.reason !== "asset_failure"} />
          <DiagRow label="WebSocket" ok={failure.reason !== "websocket_failure" && failure.reason !== "network_failure"} />
          <DiagRow label="Renderer init" ok={failure.reason !== "render_error" && failure.reason !== "canvas_missing"} />
          <DiagRow label="Scene paint" ok={failure.reason !== "scene_timeout"} />
        </div>

        {failure.message && (
          <p className="font-mono text-[9px] text-muted-foreground/70 text-center mb-3 break-all">{failure.message.slice(0, 140)}</p>
        )}

        {showButtons ? (
          <div className="flex flex-col gap-2">
            <button onClick={() => { clearFailure(); setFailure(null); onRetry(); }}
              className="font-pixel text-[10px] px-4 py-2 border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all">
              RETRY NOW
            </button>
            <button onClick={() => { clearFailure(); setFailure(null); onReturnHome(); }}
              className="font-pixel text-[10px] px-4 py-2 border border-border text-muted-foreground hover:border-secondary hover:text-secondary transition-all">
              RETURN TO MENU
            </button>
          </div>
        ) : (
          <p className="font-pixel text-[9px] text-muted-foreground text-center">Auto-retry in 2s…</p>
        )}
      </div>
    </div>
  );
}

function DiagRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={ok ? "text-green-400" : "text-red-400"}>{ok ? "OK" : "FAIL"}</span>
    </div>
  );
}
