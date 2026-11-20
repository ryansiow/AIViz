<script setup lang="ts">
import type { Concept } from '~/data/curriculum'
import type { AnyConceptModule } from '~/engine/types'

/**
 * The drawing area. With a concept module it renders the module's scene in
 * an SVG (the player animates it); without one it shows a placeholder.
 */
defineProps<{
  concept: Concept
  module?: AnyConceptModule | null
  d?: unknown
  caption?: string
  step?: number
  total?: number
  ready?: boolean
}>()

const svg = ref<SVGSVGElement>()
defineExpose({ svg })
</script>

<template>
  <div class="stage-wrap">
    <div class="stage-box" data-track-host>
      <template v-if="module && d">
        <svg ref="svg" class="scene" :class="{ ready }" :viewBox="module.viewBox" preserveAspectRatio="xMidYMid meet" role="img" :aria-label="`${concept.title} visualization`">
          <component :is="module.scene" :d="d" />
        </svg>
        <span class="hint">Hover any element to inspect it</span>
        <StageCaption v-if="caption" :step="(step ?? 0) + 1" :total="total ?? 0" :text="caption" />
      </template>

      <template v-else>
        <svg class="grid" viewBox="0 0 560 380" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <pattern id="stage-grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M50 0H0V50" fill="none" stroke="var(--grid)" />
            </pattern>
          </defs>
          <rect width="560" height="380" fill="url(#stage-grid)" />
        </svg>
        <div class="empty">
          <div class="title">{{ concept.title }}</div>
          <p>{{ concept.summary }}</p>
          <span class="tag">Visualization coming soon</span>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.stage-wrap { display: grid; min-height: 0; padding: 18px 18px 0; }
.stage-box {
  position: relative; display: grid; place-items: center; min-height: 320px;
  border: 1px solid var(--line); border-radius: var(--radius-xl); background: var(--surface); overflow: hidden;
}
.scene { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; transition: opacity var(--dur-ui) ease; }
.scene.ready { opacity: 1; }
.hint { position: absolute; top: 12px; right: 16px; font-size: 12px; color: var(--text-faint); pointer-events: none; }
.grid { position: absolute; inset: 0; width: 100%; height: 100%; }
.empty { position: relative; text-align: center; max-width: 360px; padding: 24px; }
.title { font-size: 20px; font-weight: 600; letter-spacing: -0.01em; margin-bottom: 6px; }
.empty p { color: var(--text-dim); font-size: 14px; margin-bottom: 14px; }
.tag { display: inline-block; padding: 3px 10px; border-radius: 999px; background: var(--surface-2); font-size: 12px; color: var(--text-faint); }

@media (max-width: 560px) { .hint { display: none; } }
</style>
