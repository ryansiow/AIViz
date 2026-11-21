// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxt/content'],

  // Explain view content: one Markdown file per concept in content/explain/.
  content: {
    // Node's built-in SQLite (>= 22.5) instead of compiling better-sqlite3.
    experimental: { sqliteConnector: 'native' },
    build: {
      markdown: {
        // $…$ and $$…$$ become KaTeX HTML at build time.
        remarkPlugins: { 'remark-math': {} },
        rehypePlugins: { 'rehype-katex': { output: 'html', throwOnError: false } },
        highlight: false,
        toc: { depth: 2 },
      },
    },
    renderer: {
      anchorLinks: false,
      // Short Markdown names for the explain components.
      alias: { reveal: 'RevealPhrase', formula: 'FormulaBlock' },
    },
  },

  // Pre-bundle heavy client deps so the first visit doesn't trigger a reload.
  vite: {
    optimizeDeps: { include: ['gsap', 'gsap/DrawSVGPlugin', 'katex'] },
  },

  // Components are referenced by file name, regardless of sub-folder.
  // The explain/ components are global so Markdown (MDC) can use them; they are
  // listed first, so the catch-all entry below skips them.
  components: [
    { path: '~/components/explain', pathPrefix: false, global: true },
    { path: '~/components', pathPrefix: false },
  ],

  hooks: {
    // /dev/* pages (component playground) exist only on the dev server.
    'pages:extend'(pages) {
      if (process.env.NODE_ENV !== 'production') return
      for (let i = pages.length - 1; i >= 0; i--) {
        if (pages[i]!.path.startsWith('/dev')) pages.splice(i, 1)
      }
    },
  },

  css: ['katex/dist/katex.min.css', '~/assets/css/tokens.css', '~/assets/css/base.css'],

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'AIViz',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Learn AI concepts through interactive animations.' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap',
        },
      ],
      script: [
        {
          // Apply the saved theme before first paint so there is no flash.
          innerHTML:
            "try{var t=localStorage.getItem('aiviz:theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}",
          tagPosition: 'head',
        },
      ],
    },
  },
})
