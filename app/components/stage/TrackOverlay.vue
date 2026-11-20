<script setup lang="ts">
import { hueVar } from '~/types/concept'
import { hideTrack, trackState } from '~/utils/track'

/**
 * The one overlay instance for the page. Brackets lock onto the hovered
 * element; the metadata box sits beside it, kept inside the nearest
 * [data-track-host] (the stage). Once one overlay is open, moving to the
 * next element shows it instantly (no re-animation).
 */
const box = ref({ left: 0, top: 0, width: 0, height: 0 })
const meta = ref({ left: 0, top: 0, origin: 'left top' })
const shown = ref(false)
const instant = ref(false)
const metaEl = ref<HTMLElement>()
const current = computed(() => trackState.target?.meta)

watch(
  () => trackState.target,
  async (t) => {
    if (!t) {
      shown.value = false
      return
    }
    instant.value = shown.value || performance.now() - trackState.lastHiddenAt < 250
    const r = t.el.getBoundingClientRect()
    const pad = 8
    const b = { left: r.left - pad, top: r.top - pad, width: r.width + pad * 2, height: r.height + pad * 2 }
    box.value = b

    await nextTick() // meta content rendered → measure it
    const host = (t.el.closest('[data-track-host]') as HTMLElement | null)?.getBoundingClientRect() ?? {
      left: 0, top: 0, right: innerWidth, bottom: innerHeight,
    }
    const mw = metaEl.value?.offsetWidth ?? 200
    const mh = metaEl.value?.offsetHeight ?? 120
    let x = b.left + b.width + 10
    let y = b.top
    let origin = 'left top'
    if (x + mw > host.right - 12) { x = b.left - mw - 10; origin = 'right top' }
    if (x < host.left + 12) {
      x = Math.min(Math.max(host.left + 12, b.left), host.right - mw - 12)
      y = b.top + b.height + 10
      origin = 'left top'
    }
    y = Math.min(Math.max(host.top + 12, y), host.bottom - mh - 12)
    meta.value = { left: x, top: y, origin }
    requestAnimationFrame(() => (shown.value = true))
  },
)

onMounted(() => {
  addEventListener('scroll', onScroll, true)
  addEventListener('resize', onScroll)
})
onBeforeUnmount(() => {
  removeEventListener('scroll', onScroll, true)
  removeEventListener('resize', onScroll)
})
function onScroll() { hideTrack(true) }
</script>

<template>
  <div class="trk" :class="{ instant }" :style="{ '--trk-color': hueVar(current?.hue) }" aria-hidden="true">
    <div
      class="trk-box"
      :class="{ show: shown }"
      :style="{ left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px` }"
    >
      <i /><i /><i /><i /><span class="cross" />
    </div>
    <div
      ref="metaEl"
      class="trk-meta"
      :class="{ show: shown }"
      :style="{ left: `${meta.left}px`, top: `${meta.top}px`, '--origin': meta.origin }"
    >
      <template v-if="current">
        <div class="head"><span class="live" />{{ current.id }} · <b>{{ current.kind }}</b></div>
        <div class="row"><span>object</span><span>{{ current.name }}</span></div>
        <div v-for="[k, v] in current.rows" :key="k" class="row"><span>{{ k }}</span><span>{{ v }}</span></div>
        <div v-if="current.foot" class="foot">{{ current.foot }}</div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.trk { position: fixed; inset: 0 auto auto 0; pointer-events: none; z-index: 50; }
.trk-box {
  position: fixed; opacity: 0; transform: scale(1.12);
  transition: opacity 160ms var(--ease-out), transform 180ms var(--ease-out);
}
.trk-box.show { opacity: 1; transform: scale(1); }
.trk-box i { position: absolute; width: 10px; height: 10px; border: 0 solid var(--trk-color); }
.trk-box i:nth-child(1) { left: 0; top: 0; border-width: 2px 0 0 2px; }
.trk-box i:nth-child(2) { right: 0; top: 0; border-width: 2px 2px 0 0; }
.trk-box i:nth-child(3) { left: 0; bottom: 0; border-width: 0 0 2px 2px; }
.trk-box i:nth-child(4) { right: 0; bottom: 0; border-width: 0 2px 2px 0; }
.cross {
  position: absolute; left: 50%; top: 50%; width: 9px; height: 9px; margin: -4.5px 0 0 -4.5px; opacity: 0.5;
  background:
    linear-gradient(var(--trk-color), var(--trk-color)) center / 1px 100% no-repeat,
    linear-gradient(var(--trk-color), var(--trk-color)) center / 100% 1px no-repeat;
}
.trk-meta {
  position: fixed; min-width: 196px; padding: 9px 11px 8px; border-radius: var(--radius);
  background: var(--trk-bg); color: var(--text); font: 11px/1.6 var(--font-mono);
  border: 1px solid var(--trk-border);
  -webkit-backdrop-filter: blur(12px) saturate(1.4); backdrop-filter: blur(12px) saturate(1.4);
  box-shadow: 0 8px 24px rgba(16, 24, 40, 0.08);
  opacity: 0; transform: translateY(4px) scale(0.98); transform-origin: var(--origin);
  transition: opacity 150ms var(--ease-out), transform 170ms var(--ease-out);
}
.trk-meta.show { opacity: 1; transform: none; }
.instant .trk-box, .instant .trk-meta { transition-duration: 0ms; }
.head {
  display: flex; align-items: center; gap: 6px; margin-bottom: 4px; padding-bottom: 5px;
  border-bottom: 1px solid var(--trk-border); color: var(--text-dim); letter-spacing: 0.06em;
}
.live { width: 6px; height: 6px; border-radius: 50%; background: var(--trk-live); }
.head b { color: var(--trk-color); font-weight: 600; }
.row { display: flex; justify-content: space-between; gap: 16px; }
.row span:first-child { color: var(--text-dim); }
.foot { margin-top: 4px; padding-top: 5px; border-top: 1px solid var(--trk-border); color: var(--text-dim); font-size: 10px; letter-spacing: 0.06em; }

@media (prefers-reduced-motion: reduce) {
  .trk-box { transform: none; }
}
</style>
