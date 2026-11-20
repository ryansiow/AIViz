<script setup lang="ts">
import { curriculum, totalConcepts } from '~/data/curriculum'

useHead({ title: 'AIViz — Learn AI through interactive animations' })
</script>

<template>
  <div class="page">
    <header class="hero">
      <h1>Learn AI concepts by playing with them.</h1>
      <p>{{ curriculum.length }} chapters, {{ totalConcepts }} concepts. Each one is an animation you can scrub, inputs you can change, and a written explainer.</p>
    </header>

    <ol class="chapters">
      <li v-for="(chapter, i) in curriculum" :key="chapter.slug" class="chapter">
        <NuxtLink :to="`/${chapter.slug}`" class="chapter-head">
          <span class="num">{{ String(i + 1).padStart(2, '0') }}</span>
          <span class="title">{{ chapter.title }}</span>
          <span class="count">{{ chapter.concepts.length }} concepts</span>
        </NuxtLink>
        <p class="blurb">{{ chapter.blurb }}</p>
        <ul class="concepts">
          <li v-for="concept in chapter.concepts" :key="concept.slug">
            <NuxtLink :to="`/${chapter.slug}/${concept.slug}`" class="concept pressable">
              <span class="dot" :class="concept.status" aria-hidden="true" />
              {{ concept.title }}
            </NuxtLink>
          </li>
        </ul>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.page { height: 100%; overflow-y: auto; padding: 48px 40px 80px; }
.hero { max-width: 760px; margin: 0 auto 40px; }
.hero h1 { font-size: 34px; font-weight: 700; letter-spacing: -0.03em; line-height: 1.15; margin-bottom: 12px; }
.hero p { font-size: 16px; color: var(--text-dim); max-width: 600px; }
.chapters { list-style: none; max-width: 760px; margin: 0 auto; display: flex; flex-direction: column; gap: 14px; }
.chapter { border: 1px solid var(--line); border-radius: var(--radius-lg); padding: 18px 20px; background: var(--bg); }
.chapter-head { display: flex; align-items: baseline; gap: 12px; }
.num { font: 500 12px var(--font-mono); color: var(--text-faint); }
.title { font-size: 17px; font-weight: 600; transition: color var(--dur-fast) ease; }
@media (hover: hover) and (pointer: fine) { .chapter-head:hover .title { color: var(--brand); } }
.count { margin-left: auto; font-size: 12px; color: var(--text-faint); }
.blurb { margin: 4px 0 14px 30px; font-size: 13.5px; color: var(--text-dim); }
.concepts { list-style: none; display: flex; flex-wrap: wrap; gap: 6px; margin-left: 30px; }
.concept {
  display: inline-flex; align-items: center; gap: 7px; padding: 4px 10px; border-radius: 999px;
  background: var(--surface-2); font-size: 12.5px; color: var(--text-dim);
}
@media (hover: hover) and (pointer: fine) { .concept:hover { background: var(--line-strong); color: var(--text); } }
.dot { width: 6px; height: 6px; border-radius: 50%; border: 1.5px solid var(--text-faint); }
.dot.ready { background: var(--c-green); border-color: var(--c-green); }

@media (max-width: 560px) {
  .page { padding: 28px 16px 56px; }
  .hero h1 { font-size: 26px; }
  .blurb, .concepts { margin-left: 0; }
}
</style>
