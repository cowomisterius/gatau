import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format durasi dalam detik sebagai "X hari Y jam Z menit". */
export function formatUptime(seconds: number | null | undefined): string {
  if (!seconds || seconds < 0) return '-'
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  let r = ''
  if (d > 0) r += `${d} hari `
  if (h > 0) r += `${h} jam `
  if (d === 0 && h === 0) r += `${m} menit`
  return r.trim() || `${s} detik`
}

/** Format a millisecond latency: < 1s → "NNNms", else "N.NNs". */
export function formatLatency(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || ms < 0) return '-'
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

/** Format a number with thousand separators. */
export function formatNumber(n: number | null | undefined): string {
  if (n === null || n === undefined) return '-'
  return n.toLocaleString('en-US')
}

/** Format a success rate 0..1 as percentage. */
export function formatPercent(rate: number | null | undefined): string {
  if (rate === null || rate === undefined) return '-'
  return `${(rate * 100).toFixed(1)}%`
}

/** Petakan account.state dari backend ke label tampilan. */
export function stateLabel(state: string): string {
  return (
    {
      idle: 'Siaga',
      busy: 'Sibuk',
      error: 'Bermasalah',
    } as Record<string, string>
  )[state] ?? state
}

/** Truncate a long string in the middle (for token previews). */
export function truncateMiddle(s: string, head = 8, tail = 4): string {
  if (!s) return ''
  if (s.length <= head + tail + 3) return s
  return `${s.slice(0, head)}…${s.slice(-tail)}`
}
