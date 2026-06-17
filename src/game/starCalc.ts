// Compute stars from a completed level snapshot.
// Does NOT change scoring; pure derivation.
export interface LevelOutcome {
  correct: boolean;            // level completed successfully
  mistakes: number;            // wrong answers in level
  timeMs: number;              // time taken
  parTimeMs?: number;          // optional target time (default 120s)
}

export function calcStars(o: LevelOutcome): number {
  if (!o.correct) return 0;
  const par = o.parTimeMs ?? 120_000;
  if (o.mistakes === 0 && o.timeMs <= par) return 3;
  if (o.mistakes <= 2 && o.timeMs <= par * 2) return 2;
  return 1;
}
