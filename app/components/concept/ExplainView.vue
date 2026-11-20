<script setup lang="ts">
import type { Chapter, Concept } from '~/data/curriculum'

/**
 * Full-text explainer. Phase 5 loads the concept's Markdown (Nuxt Content)
 * with KaTeX maths and reveal phrases. For now: title, summary and prev/next.
 */
defineProps<{ chapter: Chapter; concept: Concept; index: number; prev?: Concept; next?: Concept }>()
</script>

<template>
  <article class="explain">
    <div class="doc">
      <div class="eyebrow">{{ chapter.title }} · Concept {{ index + 1 }}</div>
      <h1>{{ concept.title }}</h1>
      <p class="lede">{{ concept.summary }}</p>
      <p class="pending">The full explainer for this concept hasn’t been written yet.</p>

      <nav class="pager" aria-label="Concept navigation">
        <NuxtLink v-if="prev" :to="`/${chapter.slug}/${prev.slug}?view=explain`" class="pg prev">
          <span class="dir">Previous</span>
          <span class="name">{{ prev.title }}</span>
        </NuxtLink>
        <NuxtLink v-if="next" :to="`/${chapter.slug}/${next.slug}?view=explain`" class="pg next">
          <span class="dir">Next</span>
          <span class="name">{{ next.title }}</span>
        </NuxtLink>
      </nav>
    </div>
  </article>
</template>

<style scoped>
.explain { height: 100%; overflow-y: auto; padding: 44px 48px 80px; }
.doc { max-width: 680px; margin: 0 auto; }
.eyebrow { font-size: 12px; font-weight: 600; color: var(--brand); margin-bottom: 6px; }
h1 { font-size: 32px; font-weight: 700; letter-spacing: -0.025em; margin-bottom: 14px; }
.lede { font-size: 17px; line-height: 1.65; color: var(--text-body); margin-bottom: 24px; }
.pending {
  padding: 12px 14px; border-radius: var(--radius); border: 1px dashed var(--line-strong);
  font-size: 13.5px; color: var(--text-faint);
}
.pager { display: flex; gap: 12px; margin-top: 48px; }
.pg {
  flex: 1; display: flex; flex-direction: column; gap: 2px; padding: 12px 14px;
  border: 1px solid var(--line); border-radius: var(--radius-lg);
  transition: border-color var(--dur-fast) ease, background-color var(--dur-fast) ease;
}
@media (hover: hover) and (pointer: fine) { .pg:hover { border-color: var(--line-strong); background: var(--surface); } }
.pg.next { text-align: right; margin-left: auto; }
.dir { font-size: 12px; color: var(--text-faint); }
.name { font-weight: 600; }

@media (max-width: 560px) {
  .explain { padding: 24px 16px 48px; }
  .pager { flex-direction: column; }
}
</style>
