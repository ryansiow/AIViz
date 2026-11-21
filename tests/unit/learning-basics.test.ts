import { describe, expect, it } from 'vitest'
import { STUDY, WAVE } from '~/concepts/learning-basics/data'
import { derive as supervised, trustOf } from '~/concepts/learning-basics/supervised-learning/derive'
import { derive as loss, Y_DOMAIN } from '~/concepts/learning-basics/loss-function/derive'
import { derive as ml, logLikelihood } from '~/concepts/learning-basics/maximum-likelihood/derive'
import { derive as ce, verdictOf as ceVerdict } from '~/concepts/learning-basics/cross-entropy/derive'
import { derive as overfit, sweepErrors } from '~/concepts/learning-basics/overfitting/derive'
import { derive as reg, lambdaOf } from '~/concepts/learning-basics/regularization/derive'
import { curvesOf, derive as curve, EPOCHS } from '~/concepts/learning-basics/training-curve/derive'
import { linearFit } from '~/engine/fit'

describe('shared data', () => {
  it('the study data fits exactly score = 6·hours + 46', () => {
    expect(linearFit(STUDY.x, STUDY.y)).toEqual(STUDY.best)
  })
  it('train and test points are different x values in [−1, 1]', () => {
    for (const x of WAVE.test.x) expect(WAVE.train.x).not.toContain(x)
    for (const x of [...WAVE.train.x, ...WAVE.test.x]) expect(Math.abs(x)).toBeLessThanOrEqual(1)
  })
})

describe('supervised learning', () => {
  it('predicts 73 for 4.5 hours, and 118 (impossible) for 12', () => {
    expect(supervised({ query: 4.5 }).pred).toBe(73)
    expect(supervised({ query: 4.5 }).trust).toBe('inside')
    const far = supervised({ query: 12 })
    expect(far.pred).toBe(118)
    expect(far.trust).toBe('impossible')
    // The chart grows to keep the prediction on it.
    expect(far.q.y).toBeGreaterThanOrEqual(far.f.box.y0)
  })
  it('grades extrapolation', () => {
    expect(trustOf(0, 46, STUDY.x)).toBe('near')
    expect(trustOf(9, 100, STUDY.x)).toBe('outside')
  })
})

describe('loss function', () => {
  it('default line: errors 7, 1, 0, −1, −7, −9 → MSE 181/6', () => {
    const d = loss({ w: 3, b: 55, data: 'clean' })
    expect(d.res.map((r) => r.r)).toEqual([7, 1, 0, -1, -7, -9])
    expect(d.sumSq).toBe(181)
    expect(d.mse).toBeCloseTo(181 / 6, 12)
    expect(d.worst).toBe(5)
    expect(d.best.mse).toBeCloseTo(10 / 6, 12)
  })
  it('the best line has the lowest MSE of any line', () => {
    const best = loss({ w: 6, b: 46, data: 'clean' })
    expect(best.mse).toBeCloseTo(best.best.mse, 12)
    for (const [w, b] of [[5.5, 46], [6.5, 46], [6, 45], [6, 47]]) expect(loss({ w: w!, b: b!, data: 'clean' }).mse).toBeGreaterThan(best.mse)
  })
  it('one outlier dominates through its square', () => {
    const d = loss({ w: 6, b: 46, data: 'outlier' })
    expect(d.res[d.worst]!.sq).toBe(361)
    expect(d.res[d.worst]!.sq / d.sumSq).toBeGreaterThan(0.9)
  })
  it('squares stay inside the plot for extreme lines', () => {
    for (const [w, b] of [[12, 70], [0, 20]]) {
      const d = loss({ w: w!, b: b!, data: 'outlier' })
      for (const r of d.res) {
        expect(r.square.y).toBeGreaterThanOrEqual(d.f.sy(Y_DOMAIN[1]) - 0.01)
        expect(r.square.y + r.square.s).toBeLessThanOrEqual(d.f.sy(Y_DOMAIN[0]) + 0.01)
      }
    }
  })
})

describe('maximum likelihood', () => {
  it('μ = 2.5: log L = −8.65; the peak is at the mean, 3.4', () => {
    const d = ml({ mu: 2.5, sigma: 1 })
    expect(d.logL).toBeCloseTo(-8.65, 2)
    expect(d.muHat).toBeCloseTo(3.4, 12)
    expect(d.logLMax).toBeCloseTo(-6.62, 2)
    expect(Math.log(d.likelihood)).toBeCloseTo(d.logL, 10)
  })
  it('no μ beats the mean, whatever σ', () => {
    for (const sigma of [0.5, 1, 2]) {
      const best = logLikelihood(ml({ mu: 0, sigma }).xs, 3.4, sigma)
      for (let mu = 0; mu <= 7; mu += 0.1) expect(logLikelihood(ml({ mu: 0, sigma }).xs, mu, sigma)).toBeLessThanOrEqual(best + 1e-12)
    }
  })
})

describe('cross-entropy', () => {
  it('matches the explainer: Paris 0.804 → 0.22, banana 0.0033 → 5.72', () => {
    const paris = ce({ answer: '0', T: 1 })
    expect(paris.pc).toBeCloseTo(0.804, 3)
    expect(paris.loss).toBeCloseTo(0.218, 3)
    expect(paris.verdict).toBe('confident-right')
    const banana = ce({ answer: '3', T: 1 })
    expect(banana.loss).toBeCloseTo(5.718, 3)
    expect(banana.verdict).toBe('confident-wrong')
    expect(banana.uniform).toBeCloseTo(Math.log(4), 12)
  })
  it('a hotter temperature lowers confidence in the right answer', () => {
    expect(ce({ answer: '0', T: 3 }).loss).toBeGreaterThan(ce({ answer: '0', T: 1 }).loss)
  })
  it('verdicts', () => {
    expect(ceVerdict(0.47, true)).toBe('leaning-right')
    expect(ceVerdict(0.13, false)).toBe('wrong')
    expect(ceVerdict(0.3, true)).toBe('unsure')
  })
})

describe('overfitting', () => {
  it('training error only falls with degree; test error has a U with its bottom at 3', () => {
    const s = sweepErrors()
    for (let i = 1; i < s.length; i++) expect(s[i]!.train).toBeLessThanOrEqual(s[i - 1]!.train + 1e-12)
    expect(overfit({ degree: 7 }).bestDegree).toBe(3)
    expect(s[6]!.train).toBeLessThan(1e-12) // degree 7 interpolates 8 points
    expect(s[6]!.test).toBeGreaterThan(3)
  })
  it('verdicts for the presets', () => {
    expect(overfit({ degree: 1 }).verdict).toBe('underfit')
    expect(overfit({ degree: 3 }).verdict).toBe('best')
    expect(overfit({ degree: 7 }).verdict).toBe('overfit')
  })
})

describe('regularization', () => {
  it('−7 means no penalty', () => {
    expect(lambdaOf(-7)).toBe(0)
    expect(lambdaOf(-3)).toBeCloseTo(0.001, 15)
  })
  it('λ = 0.001 shrinks the weights and cuts test error from 3.20 to 0.031', () => {
    const d = reg({ logLambda: -3 })
    expect(d.plainTest).toBeCloseTo(3.2, 1)
    expect(d.testMse).toBeCloseTo(0.031, 3)
    expect(d.maxW).toBeLessThan(d.plainMaxW / 10)
    expect(d.trainMse).toBeGreaterThan(d.plainTrain)
    expect(d.verdict).toBe('good')
  })
  it('presets: none, too little, too much', () => {
    expect(reg({ logLambda: -7 }).verdict).toBe('none')
    expect(reg({ logLambda: -5 }).verdict).toBe('too-little')
    expect(reg({ logLambda: 0 }).verdict).toBe('too-much')
  })
})

describe('training curve', () => {
  it('is deterministic and finite', () => {
    expect(curvesOf('healthy')).toEqual(curvesOf('healthy'))
    for (const id of ['healthy', 'overfitting', 'underfitting', 'unstable'] as const) {
      const c = curvesOf(id)
      expect(c.train).toHaveLength(EPOCHS + 1)
      for (const v of [...c.train, ...c.val]) expect(v > 0 && v < 2.4).toBe(true)
    }
  })
  it('overfitting: validation bottoms out early, then climbs while training falls', () => {
    const d = curve({ scenario: 'overfitting', epoch: 45 })
    expect(d.bestEpoch).toBe(23)
    expect(d.val[EPOCHS]!).toBeGreaterThan(d.bestVal + 0.5)
    expect(d.train[EPOCHS]!).toBeLessThan(d.train[d.bestEpoch]!)
  })
  it('healthy: a small gap at the end; underfitting: both high', () => {
    const h = curve({ scenario: 'healthy', epoch: 0 })
    expect(h.val[EPOCHS]! - h.train[EPOCHS]!).toBeLessThan(0.2)
    const u = curve({ scenario: 'underfitting', epoch: 0 })
    expect(Math.min(...u.train)).toBeGreaterThan(1)
  })
})
