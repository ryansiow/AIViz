// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // Pre-bundle heavy client deps so the first visit doesn't trigger a reload.
  vite: {
    optimizeDeps: { include: ['gsap', 'gsap/DrawSVGPlugin', 'katex'] },
  },

  // Components are referenced by file name, regardless of sub-folder.
  components: [{ path: '~/components', pathPrefix: false }],

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
