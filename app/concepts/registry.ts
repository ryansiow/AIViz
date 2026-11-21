import type { AnyConceptModule } from '~/engine/types'

/**
 * Concepts with an interactive visualisation, keyed "<chapter>/<concept>".
 * Each loads on demand, so a page only downloads its own concept.
 * A concept listed here must be `status: 'ready'` in the curriculum
 * (a unit test checks this).
 */
export const conceptLoaders: Record<string, () => Promise<{ default: AnyConceptModule }>> = {
  'foundations/dot-product': () => import('./foundations/dot-product'),
  'transformers-llms/softmax': () => import('./transformers-llms/softmax'),
  'optimisation/gradient-descent': () => import('./optimisation/gradient-descent'),
  'optimisation/learning-rate': () => import('./optimisation/learning-rate'),
  'transformers-llms/temperature': () => import('./transformers-llms/temperature'),
}

export const hasConcept = (chapter: string, concept: string) => `${chapter}/${concept}` in conceptLoaders

export async function loadConcept(chapter: string, concept: string): Promise<AnyConceptModule | null> {
  const load = conceptLoaders[`${chapter}/${concept}`]
  return load ? (await load()).default : null
}
