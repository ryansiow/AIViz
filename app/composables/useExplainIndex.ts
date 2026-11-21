import { parseExplainPath } from '~/utils/explain'

export interface ExplainEntry {
  draft: boolean
}

/**
 * Which concepts have an explainer, and whether it is still a draft.
 * Keyed "<chapter>/<concept>". Shared by the sidebar and topbar (one fetch, same key).
 */
export function useExplainIndex() {
  const { data } = useAsyncData('explain-index', () => queryCollection('explain').select('path', 'draft').all(), {
    default: () => [],
  })

  const index = computed(() => {
    const map = new Map<string, ExplainEntry>()
    for (const row of data.value ?? []) {
      const slugs = parseExplainPath(row.path)
      if (slugs) map.set(`${slugs.chapter}/${slugs.concept}`, { draft: row.draft === true })
    }
    return map
  })

  const isDraft = (chapter: string, concept: string) => index.value.get(`${chapter}/${concept}`)?.draft === true

  return { index, isDraft }
}
