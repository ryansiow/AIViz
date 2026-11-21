<script setup lang="ts">
import { findChapter, findConcept } from '~/data/curriculum'

const route = useRoute()
const { toggle: toggleSidebar, open } = useSidebar()
const { view, setView } = useConceptView()
const { isDraft } = useExplainIndex()

const chapterSlug = computed(() => route.params.chapter as string | undefined)
const conceptSlug = computed(() => route.params.concept as string | undefined)
const chapter = computed(() => (chapterSlug.value ? findChapter(chapterSlug.value) : undefined))
const concept = computed(() =>
  chapterSlug.value && conceptSlug.value ? findConcept(chapterSlug.value, conceptSlug.value)?.concept : undefined,
)
</script>

<template>
  <header class="topbar">
    <button
      class="icon-btn pressable"
      :aria-label="open ? 'Hide curriculum' : 'Show curriculum'"
      :aria-expanded="open"
      aria-controls="curriculum"
      @click="toggleSidebar"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
        <path d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
    <NuxtLink to="/" class="brand">AIViz</NuxtLink>

    <nav v-if="chapter" class="crumbs" aria-label="Breadcrumb">
      <NuxtLink :to="`/${chapter.slug}`">{{ chapter.title }}</NuxtLink>
      <template v-if="concept">
        <span aria-hidden="true">›</span>
        <b>{{ concept.title }}</b>
        <span
          v-if="isDraft(chapterSlug!, conceptSlug!)"
          class="draft-chip"
          title="The explainer is a first draft, not yet reviewed"
        >In draft</span>
      </template>
    </nav>

    <div class="right">
      <ThemeToggle />
      <div v-if="concept" class="tabs" role="tablist" aria-label="Concept view">
        <button
          role="tab"
          class="tab"
          :aria-selected="view === 'visualize'"
          @click="setView('visualize')"
        >
          Visualize
        </button>
        <button
          role="tab"
          class="tab"
          :aria-selected="view === 'explain'"
          @click="setView('explain')"
        >
          Explain
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.topbar {
  height: var(--topbar-h);
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0 18px;
  border-bottom: 1px solid var(--line);
  background: var(--bg);
}
.brand { font-weight: 700; font-size: 18px; letter-spacing: -0.02em; color: var(--brand); }
.crumbs { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-faint); min-width: 0; }
.crumbs a { transition: color var(--dur-fast) ease; }
@media (hover: hover) and (pointer: fine) { .crumbs a:hover { color: var(--text); } }
.crumbs b { color: var(--text); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.draft-chip {
  flex: none; padding: 2px 8px; border-radius: 999px; font-size: 11.5px; font-weight: 600; line-height: 18px;
  color: var(--c-amber); background: var(--c-amber-soft);
}
.right { margin-left: auto; display: flex; align-items: center; gap: 10px; }
.tabs { display: flex; padding: 3px; gap: 2px; background: var(--surface-2); border-radius: 10px; }
.tab {
  padding: 5px 16px; border-radius: var(--radius); font-size: 13px; font-weight: 500; color: var(--text-dim);
  transition: color var(--dur-fast) ease, background-color var(--dur-fast) ease, box-shadow var(--dur-fast) ease;
}
.tab[aria-selected="true"] { background: var(--bg); color: var(--text); box-shadow: var(--shadow-sm); }

:deep(.icon-btn) {
  width: 32px; height: 32px; border-radius: var(--radius); display: grid; place-items: center; color: var(--text-dim);
}
:deep(.icon-btn svg) { width: 17px; height: 17px; }
@media (hover: hover) and (pointer: fine) { :deep(.icon-btn:hover) { background: var(--surface); color: var(--text); } }

/* Narrow: drop the trail, keep the draft chip. */
@media (max-width: 760px) { .crumbs > :not(.draft-chip) { display: none; } }
@media (max-width: 560px) {
  .topbar { gap: 8px; padding: 0 12px; }
  .tab { padding: 5px 10px; }
}
</style>
