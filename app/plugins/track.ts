import type { Directive } from 'vue'
import type { TrackMeta } from '~/types/concept'
import { hideTrack, showTrack } from '~/utils/track'

/**
 * v-track="meta" — hovering the element shows the tracking overlay with
 * corner brackets and the given metadata. Use on diagram elements only.
 * Elements with a `data-inactive` attribute are ignored (e.g. not yet revealed).
 */
type TrackEl = Element & { __track?: { meta: TrackMeta; enter: () => void; leave: () => void } }

const track: Directive<TrackEl, TrackMeta> = {
  mounted(el, binding) {
    const state = {
      meta: binding.value,
      enter: () => {
        if (el.hasAttribute('data-inactive')) return
        showTrack(el, state.meta)
      },
      leave: () => hideTrack(),
    }
    el.__track = state
    el.addEventListener('pointerenter', state.enter)
    el.addEventListener('pointerleave', state.leave)
  },
  updated(el, binding) {
    if (el.__track) el.__track.meta = binding.value
  },
  beforeUnmount(el) {
    if (!el.__track) return
    el.removeEventListener('pointerenter', el.__track.enter)
    el.removeEventListener('pointerleave', el.__track.leave)
    hideTrack(true)
  },
  getSSRProps: () => ({}),
}

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('track', track)
})
