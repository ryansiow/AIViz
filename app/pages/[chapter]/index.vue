<script setup lang="ts">
import { curriculum, findChapter } from '~/data/curriculum'

const route = useRoute()
const chapter = computed(() => findChapter(route.params.chapter as string))
if (!chapter.value) {
  throw createError({ statusCode: 404, statusMessage: 'Chapter not found', fatal: true })
}
const number = computed(() => curriculum.findIndex((c) => c.slug === chapter.value?.slug) + 1)

useHead(() => ({ title: `${chapter.value?.title} — AIViz` }))
</script>

<template>
  <div v-if="chapter" class="page">
    <header class="head">
      <div class="eyebrow">Chapter {{ number }}</div>
      <h1>{{ chapter.title }}</h1>
      <p>{{ chapter.blurb }}</p>
    </header>

    <ol class="list">
      <li v-for="(concept, i) in chapter.concepts" :key="concept.slug">
        <NuxtLink :to="`/${chapter.slug}/${concept.slug}`" class="row">
          <span class="num">{{ String(i + 1).padStart(2, '0') }}</span>
          <span class="body">
            <span class="title">{{ concept.title }}</span>
            <span class="summary">{{ concept.summary }}</span>
          </span>
          <span class="status" :class="concept.status">{{ concept.status === 'ready' ? 'Interactive' : 'Planned' }}</span>
        </NuxtLink>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.page { height: 100%; overflow-y: auto; padding: 48px 40px 80px; }
.head, .list { max-width: 720px; margin: 0 auto; }
.head { margin-bottom: 28px; }
.eyebrow { font-size: 12px; font-weight: 600; color: var(--brand); margin-bottom: 6px; }
h1 { font-size: 32px; font-weight: 700; letter-spacing: -0.025em; margin-bottom: 8px; }
.head p { color: var(--text-dim); font-size: 15px; }
.list { list-style: none; border: 1px solid var(--line); border-radius: var(--radius-lg); overflow: hidden; }
.list li + li { border-top: 1px solid var(--line); }
.row { display: flex; align-items: center; gap: 16px; padding: 14px 18px; transition: background-color var(--dur-fast) ease; }
@media (hover: hover) and (pointer: fine) { .row:hover { background: var(--surface); } }
.num { font: 500 12px var(--font-mono); color: var(--text-faint); }
.body { display: flex; flex-direction: column; min-width: 0; }
.title { font-weight: 600; }
.summary { font-size: 13px; color: var(--text-dim); }
.status { margin-left: auto; flex: none; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 999px; background: var(--surface-2); color: var(--text-faint); }
.status.ready { background: var(--c-green-soft); color: var(--c-green); }

@media (max-width: 560px) {
  .page { padding: 28px 16px 56px; }
  .status { display: none; }
}
</style>
