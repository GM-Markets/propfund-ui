export type TvBar = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

const MAX_FILLED = 2_000;

function bar(time: number, open: number, high: number, low: number, close: number, volume: number): TvBar {
  return { time, open, high, low, close, volume };
}

function flatFrom(prev: TvBar, time: number): TvBar {
  return bar(time, prev.close, prev.close, prev.close, prev.close, 0);
}

export function fillBarGaps(bars: TvBar[], barMs: number, untilMs = Date.now()): TvBar[] {
  if (!(barMs > 0) || bars.length === 0) return bars;
  const sorted = [...bars].sort((a, b) => a.time - b.time);
  const out: TvBar[] = [];
  for (const cur of sorted) {
    if (out.length === 0) {
      out.push(cur);
      continue;
    }
    const prev = out[out.length - 1]!;
    if (cur.time <= prev.time) {
      out[out.length - 1] = cur;
      continue;
    }
    let filled = 0;
    for (let t = prev.time + barMs; t < cur.time && filled < MAX_FILLED; t += barMs) {
      out.push(flatFrom(out[out.length - 1]!, t));
      filled += 1;
    }
    out.push(cur);
  }
  const lastWanted = Math.floor(untilMs / barMs) * barMs;
  const tail = out[out.length - 1]!;
  if (lastWanted > tail.time) {
    let filled = 0;
    for (let t = tail.time + barMs; t <= lastWanted && filled < MAX_FILLED; t += barMs) {
      out.push(flatFrom(out[out.length - 1]!, t));
      filled += 1;
    }
  }
  return out;
}

export function applyLiveBar(lastBar: TvBar | null, px: number, barMs: number, now = Date.now()): TvBar[] {
  if (!(px > 0) || !(barMs > 0)) return lastBar ? [lastBar] : [];
  const barTime = Math.floor(now / barMs) * barMs;
  if (!lastBar) return [bar(barTime, px, px, px, px, 0)];
  if (barTime <= lastBar.time) {
    return [
      bar(
        lastBar.time,
        lastBar.open,
        Math.max(lastBar.high, px),
        Math.min(lastBar.low, px),
        px,
        lastBar.volume,
      ),
    ];
  }
  const filled = fillBarGaps([lastBar], barMs, barTime).filter((row) => row.time > lastBar.time);
  const next = filled[filled.length - 1];
  if (!next || next.time !== barTime) return filled;
  filled[filled.length - 1] = bar(
    barTime,
    next.open,
    Math.max(next.high, px),
    Math.min(next.low, px),
    px,
    next.volume,
  );
  return filled;
}
