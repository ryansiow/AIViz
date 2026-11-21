/**
 * Shared datasets for the Learning Basics chapter.
 *
 * STUDY: hours studied → exam score. Chosen so the least-squares line is
 * exactly score = 6·hours + 46 (residuals −1, 2, 0, −2, 1, 0, MSE = 10/6),
 * so learners can check every number by hand.
 *
 * WAVE: a smooth curve plus fixed noise, as a training set and a held-out
 * test set at different x. Used by Overfitting and Regularization.
 */

export const STUDY = {
  x: [1, 2, 3, 4, 5, 6],
  y: [51, 60, 64, 68, 77, 82],
  best: { w: 6, b: 46 },
}
/** The same data with one unusual student (5 h, 95 points), to show how squaring magnifies big errors. */
export const STUDY_OUTLIER = { x: STUDY.x, y: [51, 60, 64, 68, 95, 82] }

export const waveTruth = (x: number) => Math.sin(Math.PI * x)
const TRAIN_X = [-0.95, -0.7, -0.45, -0.2, 0.05, 0.3, 0.55, 0.85]
const TRAIN_NOISE = [0.12, -0.15, 0.1, 0.18, -0.12, 0.05, -0.2, 0.14]
const TEST_X = [-0.82, -0.57, -0.32, -0.07, 0.18, 0.43, 0.7, 0.95]
const TEST_NOISE = [-0.08, 0.1, -0.12, 0.06, 0.15, -0.1, 0.08, -0.14]
const r2 = (v: number) => Math.round(v * 100) / 100

export const WAVE = {
  range: [-1, 1] as [number, number],
  train: { x: TRAIN_X, y: TRAIN_X.map((x, i) => r2(waveTruth(x) + TRAIN_NOISE[i]!)) },
  test: { x: TEST_X, y: TEST_X.map((x, i) => r2(waveTruth(x) + TEST_NOISE[i]!)) },
}
