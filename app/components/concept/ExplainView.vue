<script setup lang="ts">
import type { ExplainCollectionItem } from '@nuxt/content'
import type { Chapter, Concept } from '~/data/curriculum'

/**
 * Full-text explainer from content/explain/<chapter>/<concept>.md. The concept
 * page loads `doc` (so it is prerendered). Maths is KaTeX, rendered at build time;
 * reveals and coloured terms are MDC components. No `doc`: summary + a note.
 */
const props = defineProps<{
  chapter: Chapter
  concept: Concept
  index: number
  prev?: Concept
  next?: Concept
  doc?: ExplainCollectionItem | null
}>()

// The reveal hint sits at the top, only when the text has something to reveal.
const hasReveals = computed(() => JSON.stringify(props.doc?.body ?? '').includes('"reveal"'))
</script>

<template>
  <article class="explain">
    <div class="doc">
      <div class="eyebrow">{{ chapter.title }} · Concept {{ index + 1 }}</div>
      <h1>{{ concept.title }}</h1>

      <template v-if="doc">
        <RevealHint v-if="hasReveals" />
        <ContentRenderer :value="doc" class="prose" />
      </template>
      <template v-else>
        <p class="lede">{{ concept.summary }}</p>
        <p class="pending">The full explainer for this concept hasn’t been written yet.</p>
      </template>

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
.prose { overflow-wrap: break-word; }
.doc { max-width: 680px; margin: 0 auto; }
.eyebrow { font-size: 12px; font-weight: 600; color: var(--brand); margin-bottom: 6px; }
h1 { font-size: 32px; font-weight: 700; letter-spacing: -0.025em; margin-bottom: 22px; }
.lede { font-size: 17px; line-height: 1.65; color: var(--text-body); margin-bottom: 24px; }
.pending {
  padding: 12px 14px; border-radius: var(--radius); border: 1px dashed var(--line-strong);
  font-size: 13.5px; color: var(--text-faint);
}

/* Markdown body (the mock's .doc styles) */
.prose :deep(h2) { font-size: 17px; font-weight: 600; color: var(--text); margin: 32px 0 10px; }
.prose :deep(h3) { font-size: 15.5px; font-weight: 600; color: var(--text); margin: 24px 0 8px; }
.prose :deep(p),
.prose :deep(li) { font-size: 15.5px; line-height: 1.75; color: var(--text-body); }
.prose :deep(p) { margin-bottom: 14px; }
.prose :deep(ul),
.prose :deep(ol) { margin: 0 0 14px; padding-left: 22px; }
.prose :deep(li) { margin-bottom: 4px; }
.prose :deep(li::marker) { color: var(--text-faint); }
.prose :deep(strong) { font-weight: 600; color: var(--text); }
.prose :deep(a) { color: var(--brand); text-decoration: underline; text-underline-offset: 2px; }
.prose :deep(code) {
  font-family: var(--font-mono); font-size: 0.88em; padding: 1px 5px; border-radius: 4px; background: var(--surface-2);
}
.prose :deep(table) {
  width: 100%; margin: 18px 0; border-collapse: collapse; font-size: 14px; font-variant-numeric: tabular-nums;
}
.prose :deep(th),
.prose :deep(td) { padding: 7px 10px; border-bottom: 1px solid var(--line); text-align: left; color: var(--text-body); }
.prose :deep(th) { font-weight: 600; color: var(--text); background: var(--surface); }
.prose :deep(blockquote) {
  margin: 18px 0; padding: 2px 0 2px 14px; border-left: 3px solid var(--line-strong); color: var(--text-dim);
}
/* $$…$$ display maths gets the FormulaBlock card */
.prose :deep(.katex-display) {
  display: block; margin: 18px 0; padding: 14px 16px; border-radius: 10px; overflow-x: auto; overflow-y: hidden;
  background: var(--surface); border: 1px solid var(--line); color: var(--text);
}
.prose :deep(.katex) { font-size: 1.06em; }

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
  .prose :deep(table) { display: block; overflow-x: auto; }
  .pager { flex-direction: column; }
}
</style>
