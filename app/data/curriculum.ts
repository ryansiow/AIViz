/**
 * The curriculum: chapters and the concepts inside them, in learning order.
 * This is the single source of truth for navigation and routing.
 *
 * `status` says whether a concept's visualisation is built yet:
 *   - 'ready'   → has an interactive visualisation
 *   - 'planned' → page exists (Explain text may follow), visualisation not built yet
 *
 * `reviewed` (ready concepts only): the owner has reviewed the visualisation.
 * New visualisations ship unreviewed and show the amber "In draft" markers.
 *
 * `format`: 'animation' (default) is a full stepped animation. 'text' marks a
 * text-first concept: a written explainer with one simple diagram, because a
 * long animation would not teach it better.
 */

export type ConceptStatus = 'ready' | 'planned'
export type ConceptFormat = 'animation' | 'text'

export interface Concept {
  slug: string
  title: string
  summary: string
  status: ConceptStatus
  reviewed: boolean
  format: ConceptFormat
}

export interface Chapter {
  slug: string
  title: string
  blurb: string
  concepts: Concept[]
}

const c = (
  slug: string,
  title: string,
  summary: string,
  status: ConceptStatus = 'planned',
  extra: Partial<Pick<Concept, 'reviewed' | 'format'>> = {},
): Concept => ({
  slug,
  title,
  summary,
  status,
  reviewed: extra.reviewed ?? false,
  format: extra.format ?? 'animation',
})

export const curriculum: Chapter[] = [
  {
    slug: 'foundations',
    title: 'Foundations',
    blurb: 'The vector and calculus toolkit every model is built from.',
    concepts: [
      c('vectors', 'Vectors', 'Arrows with direction and length; lists of numbers.', 'ready'),
      c('dot-product', 'Dot Product', 'One number that says how much two vectors align.', 'ready', { reviewed: true }),
      c('cosine-similarity', 'Cosine Similarity', 'Compare direction, ignore length.', 'ready'),
      c('matrix-multiplication', 'Matrix Multiplication', 'Many dot products at once.', 'ready'),
      c('derivatives-chain-rule', 'Derivatives & Chain Rule', 'How a change flows through composed functions.', 'ready'),
    ],
  },
  {
    slug: 'learning-basics',
    title: 'Learning Basics',
    blurb: 'What it means for a model to learn from data.',
    concepts: [
      c('supervised-learning', 'Supervised Learning', 'Learn f from examples of X and Y.'),
      c('loss-function', 'Loss Function', 'A single number for how wrong the model is.'),
      c('maximum-likelihood', 'Maximum Likelihood', 'Pick parameters that make the data most probable.'),
      c('cross-entropy', 'Cross-Entropy Loss', 'The classification loss behind every LLM.'),
      c('overfitting', 'Overfitting', 'Memorising the training set instead of the pattern.'),
      c('regularization', 'Regularization', 'Weight decay, dropout and early stopping.'),
      c('training-curve', 'Training Curve', 'Reading loss curves to diagnose training.'),
    ],
  },
  {
    slug: 'neural-networks',
    title: 'Neural Networks',
    blurb: 'From one neuron to deep networks, and how they learn.',
    concepts: [
      c('perceptron', 'Perceptron', 'A dot product, a bias and a nonlinearity.'),
      c('activation-functions', 'Activation Functions', 'Sigmoid, tanh, ReLU and why they matter.'),
      c('dense-layer', 'Dense Layer', 'Matrix multiply, add bias, activate.'),
      c('multilayer-perceptron', 'Multilayer Perceptron', 'Stacked dense layers.'),
      c('universal-approximation', 'Universal Approximation', 'Why wide networks can fit any function.', 'planned', { format: 'text' }),
      c('backpropagation', 'Backpropagation', 'The chain rule, run backwards.'),
      c('vanishing-gradients', 'Vanishing & Exploding Gradients', 'When products of derivatives shrink or blow up.'),
      c('dropout', 'Dropout', 'Randomly switch neurons off while training.'),
    ],
  },
  {
    slug: 'optimisation',
    title: 'Optimisation',
    blurb: 'How parameters move towards a lower loss.',
    concepts: [
      c('gradient-descent', 'Gradient Descent', 'Step downhill against the gradient.', 'ready', { reviewed: true }),
      c('learning-rate', 'Learning Rate', 'The step size, and the most important knob.', 'ready'),
      c('stochastic-gradient-descent', 'Stochastic Gradient Descent', 'Noisy steps from mini-batches.'),
      c('adam', 'Adam', 'Momentum plus per-parameter step sizes.'),
      c('early-stopping', 'Early Stopping', 'Keep the checkpoint with the lowest validation loss.'),
      c('hyperparameter-tuning', 'Hyperparameter Tuning', 'Train, validate, test and search.', 'planned', { format: 'text' }),
    ],
  },
  {
    slug: 'transformers-llms',
    title: 'Transformers & LLMs',
    blurb: 'The architecture behind modern language models.',
    concepts: [
      c('tokenization', 'Tokenization', 'Splitting text into tokens.'),
      c('embeddings', 'Embeddings', 'Meaning as a position in space.'),
      c('softmax', 'Softmax', 'Turn scores into probabilities.', 'ready', { reviewed: true }),
      c('temperature', 'Temperature', 'Sharpen or flatten next-token sampling.', 'ready'),
      c('attention', 'Attention', 'Every token weighs every other token.'),
      c('multi-head-attention', 'Multi-Head Attention', 'Several attention patterns in parallel.'),
      c('transformer-block', 'Transformer Block', 'Attention plus a feed-forward network.'),
      c('context-window', 'Context Window', 'How many tokens the model can see.', 'planned', { format: 'text' }),
      c('llm-training-pipeline', 'LLM Training Pipeline', 'Pre-training, fine-tuning and RLHF.', 'planned', { format: 'text' }),
    ],
  },
  {
    slug: 'generative-models',
    title: 'Generative Models',
    blurb: 'Models that learn a distribution you can sample from.',
    concepts: [
      c('sampling', 'Sampling', 'Inverse transform and rejection sampling.'),
      c('autoencoder', 'Autoencoder', 'Compress to a bottleneck and reconstruct.'),
      c('latent-space', 'Latent Space', 'The low-dimensional space data is generated from.'),
      c('kl-divergence', 'KL Divergence', 'How far one distribution is from another.'),
      c('variational-autoencoder', 'Variational Autoencoder', 'Encoders that output distributions.'),
      c('elbo', 'ELBO', 'A tractable lower bound on the likelihood.', 'planned', { format: 'text' }),
    ],
  },
]

export function findChapter(slug: string): Chapter | undefined {
  return curriculum.find((ch) => ch.slug === slug)
}

export function findConcept(chapterSlug: string, conceptSlug: string) {
  const chapter = findChapter(chapterSlug)
  const concept = chapter?.concepts.find((co) => co.slug === conceptSlug)
  if (!chapter || !concept) return undefined
  const index = chapter.concepts.indexOf(concept)
  return {
    chapter,
    concept,
    index,
    prev: chapter.concepts[index - 1],
    next: chapter.concepts[index + 1],
  }
}

export const totalConcepts = curriculum.reduce((n, ch) => n + ch.concepts.length, 0)
