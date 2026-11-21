import type { AnyConceptModule } from '~/engine/types'

/**
 * Concepts with an interactive visualisation, keyed "<chapter>/<concept>".
 * Each loads on demand, so a page only downloads its own concept.
 * A concept listed here must be `status: 'ready'` in the curriculum
 * (a unit test checks this).
 */
export const conceptLoaders: Record<string, () => Promise<{ default: AnyConceptModule }>> = {
  'foundations/vectors': () => import('./foundations/vectors'),
  'foundations/dot-product': () => import('./foundations/dot-product'),
  'foundations/cosine-similarity': () => import('./foundations/cosine-similarity'),
  'foundations/matrix-multiplication': () => import('./foundations/matrix-multiplication'),
  'foundations/derivatives-chain-rule': () => import('./foundations/derivatives-chain-rule'),
  'learning-basics/supervised-learning': () => import('./learning-basics/supervised-learning'),
  'learning-basics/loss-function': () => import('./learning-basics/loss-function'),
  'learning-basics/maximum-likelihood': () => import('./learning-basics/maximum-likelihood'),
  'learning-basics/cross-entropy': () => import('./learning-basics/cross-entropy'),
  'learning-basics/overfitting': () => import('./learning-basics/overfitting'),
  'learning-basics/regularization': () => import('./learning-basics/regularization'),
  'learning-basics/training-curve': () => import('./learning-basics/training-curve'),
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
