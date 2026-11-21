import { defineCollection, defineContentConfig, z } from '@nuxt/content'

/**
 * Explain view content. One file per concept:
 *   content/explain/<chapter>/<concept>.md  →  path /explain/<chapter>/<concept>
 * The path is the link to the curriculum (checked by tests/unit/explain-content.test.ts).
 */
export default defineContentConfig({
  collections: {
    explain: defineCollection({
      type: 'page',
      source: 'explain/**/*.md',
      schema: z.object({
        /** Written by Claude and not yet reviewed by the owner. Shows an amber dot and an "In draft" chip. */
        draft: z.boolean().default(false),
        /** Last meaningful edit, YYYY-MM-DD. */
        updated: z.string().optional(),
      }),
    }),
  },
})
