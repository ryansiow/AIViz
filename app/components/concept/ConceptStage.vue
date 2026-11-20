<script setup lang="ts">
import type { Concept } from '~/data/curriculum'

/**
 * The drawing area. Phase 3 mounts the concept's SVG scene here and drives it
 * with a GSAP timeline. For now it shows an empty grid and a status note.
 */
defineProps<{ concept: Concept }>()
</script>

<template>
  <div class="stage-wrap">
    <div class="stage-box">
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
    </div>
  </div>
</template>

<style scoped>
.stage-wrap { display: grid; min-height: 0; padding: 18px 18px 0; }
.stage-box {
  position: relative; display: grid; place-items: center; min-height: 320px;
  border: 1px solid var(--line); border-radius: var(--radius-xl); background: var(--surface); overflow: hidden;
}
.grid { position: absolute; inset: 0; width: 100%; height: 100%; }
.empty { position: relative; text-align: center; max-width: 360px; padding: 24px; }
.title { font-size: 20px; font-weight: 600; letter-spacing: -0.01em; margin-bottom: 6px; }
.empty p { color: var(--text-dim); font-size: 14px; margin-bottom: 14px; }
.tag { display: inline-block; padding: 3px 10px; border-radius: 999px; background: var(--surface-2); font-size: 12px; color: var(--text-faint); }
</style>
