import { findConcept } from '~/data/curriculum'
import { parseExplainPath } from '~/utils/explain'

export interface ReviewStatus {
  /** The concept has an explainer marked `draft: true`. */
  explainerDraft: boolean
  /** The concept has a visualisation the owner has not reviewed yet. */
  visualUnreviewed: boolean
  /** Either of the above: show the amber dot and the "In draft" chip. */
  inDraft: boolean
}

/**
 * What still needs the owner's review, per concept: draft explainers (from
 * content front matter) and unreviewed visualisations (from the curriculum).
 * Shared by the sidebar and topbar (one fetch, same key).
 */
export function useReviewStatus() {
  const { data } = useAsyncData('explain-index', () => queryCollection('explain').select('path', 'draft').all(), {
    default: () => [],
  })

  const drafts = computed(() => {
    const set = new Set<string>()
    for (const row of data.value ?? []) {
      const slugs = parseExplainPath(row.path)
      if (slugs && row.draft === true) set.add(`${slugs.chapter}/${slugs.concept}`)
    }
    return set
  })

  function status(chapter: string, concept: string): ReviewStatus {
    const c = findConcept(chapter, concept)?.concept
    const explainerDraft = drafts.value.has(`${chapter}/${concept}`)
    const visualUnreviewed = c?.status === 'ready' && !c.reviewed
    return { explainerDraft, visualUnreviewed, inDraft: explainerDraft || visualUnreviewed }
  }

  /** Short description for tooltips and screen readers, or '' when nothing is pending. */
  function describe(s: ReviewStatus): string {
    if (s.explainerDraft && s.visualUnreviewed) return 'Visualisation and explainer not reviewed yet'
    if (s.visualUnreviewed) return 'Visualisation not reviewed yet'
    if (s.explainerDraft) return 'Explainer is a first draft, not reviewed yet'
    return ''
  }

  return { status, describe }
}
