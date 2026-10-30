import { useEffect, useMemo } from 'react'
import type { WorkspaceData } from '../types'

type Seen = Record<string, number>

const read = (key: string): Seen | null => {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') as Seen | null } catch { return null }
}

/**
 * Activities added or edited by someone since this browser last showed the trip's plan.
 * They stay marked while the page is open and count as seen once the viewer leaves it.
 * The first visit records a baseline so nothing is marked.
 */
export function useSeenItinerary(data: WorkspaceData | null | undefined) {
  const key = `wander-plan:seen-itinerary:${data?.currentUserId ?? 'demo'}:${data?.trip.id ?? 'none'}`
  const itinerary = useMemo(() => data?.itinerary ?? [], [data?.itinerary])
  // Read once per trip view: edits arriving through Realtime while open are marked against this baseline.
  const baseline = useMemo(() => read(key), [key])
  const changed = useMemo(() => new Set(baseline ? itinerary.filter((item) => (baseline[item.id] ?? 0) < item.version).map((item) => item.id) : []), [baseline, itinerary])
  useEffect(() => () => {
    try { localStorage.setItem(key, JSON.stringify(Object.fromEntries(itinerary.map((item) => [item.id, item.version])))) } catch { /* storage full or blocked: marks reappear next time */ }
  }, [key, itinerary])
  return changed
}
