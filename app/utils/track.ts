import type { TrackMeta } from '~/types/concept'

/**
 * Store behind the hover tracking overlay. Only the client ever writes to it
 * (pointer events), so a plain module-level reactive object is safe.
 */
export interface TrackTarget {
  el: Element
  meta: TrackMeta
}

export const trackState = reactive<{ target: TrackTarget | null; lastHiddenAt: number }>({
  target: null,
  lastHiddenAt: 0,
})

let hideTimer: ReturnType<typeof setTimeout> | undefined

export function showTrack(el: Element, meta: TrackMeta) {
  clearTimeout(hideTimer)
  trackState.target = { el, meta }
}

/** Short delay so moving between neighbouring elements does not flicker. */
export function hideTrack(immediate = false) {
  clearTimeout(hideTimer)
  const go = () => {
    if (trackState.target) trackState.lastHiddenAt = performance.now()
    trackState.target = null
  }
  if (immediate) go()
  else hideTimer = setTimeout(go, 60)
}
