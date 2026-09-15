export function percentToScaleBps(percent: number): number {
  return Math.round(percent * 100);
}

export function scaleBpsToPercent(bps: number): number {
  return bps / 100;
}
