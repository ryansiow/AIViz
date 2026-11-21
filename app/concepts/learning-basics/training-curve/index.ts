import { activate, drawIn, fadeIn, holdUntil, popIn, riseIn } from '~/engine/beats'
import { defineConcept } from '~/engine/types'
import { roundTo } from '~/utils/math'
import { derive, EPOCHS, params, VIEW, type ScenarioId, type TCData } from './derive'
import Scene from './Scene.vue'

const n = (v: number) => String(roundTo(v, 2))
const last = (a: number[]) => a[a.length - 1]!

const trainText: Record<ScenarioId, string> = {
  healthy: 'Training loss drops fast, then levels off: the model is learning.',
  overfitting: 'Training loss drops steeply and keeps going, almost to zero.',
  underfitting: 'Training loss barely drops and levels off high: the model cannot fit even the data it trains on.',
  unstable: 'Training loss drops at first, then bounces up and down instead of settling.',
}

const gapText = (d: TCData) => {
  const gap = last(d.val) - last(d.train)
  return `After ${EPOCHS} epochs: training ${n(last(d.train))}, validation ${n(last(d.val))}. The gap between them (${n(gap)}) is how much worse the model does on data it has not memorised.`
}

const diagnosis: Record<ScenarioId, (d: TCData) => string> = {
  healthy: () => 'Healthy: both curves fall and flatten together, with a small gap. More epochs would add little; this run is done.',
  overfitting: (d) =>
    `Overfitting: validation loss bottoms out at epoch ${d.bestEpoch} and then climbs while training loss keeps falling. Keep the checkpoint from epoch ${d.bestEpoch} (early stopping), or add regularization or more data.`,
  underfitting: () => 'Underfitting: both losses stay high and close together. The model is too simple (or training too short): try a bigger model or better features.',
  unstable: () => 'Unstable: the loss bounces instead of settling, the classic sign of a learning rate that is too high. Lower it and the curve should smooth out.',
}

export default defineConcept({
  params,
  presets: [
    { label: 'Healthy', values: { scenario: 'healthy', epoch: 45 } },
    { label: 'Overfitting', values: { scenario: 'overfitting', epoch: 45 } },
    { label: 'Underfitting', values: { scenario: 'underfitting', epoch: 45 } },
    { label: 'Learning rate too high', values: { scenario: 'unstable', epoch: 45 } },
  ],
  derive,
  viewBox: `0 0 ${VIEW.w} ${VIEW.h}`,
  scene: Scene,

  steps: [
    {
      id: 'axes',
      caption: () => 'A training curve plots the loss after each epoch (one full pass over the training data). Lower is better.',
      log: () => [{ text: `${EPOCHS} epochs` }],
    },
    {
      id: 'train',
      caption: (d) => trainText[d.scenario],
      log: (d) => [{ text: 'training: ' }, { text: `${n(d.train[0]!)} → ${n(last(d.train))}`, hue: 'blue' }],
    },
    {
      id: 'val',
      caption: () => 'Validation loss: the same loss measured on held-out data the model never trains on, checked after every epoch.',
      log: (d) => [{ text: 'validation: ' }, { text: `${n(d.val[0]!)} → ${n(last(d.val))}`, hue: 'rose' }],
    },
    {
      id: 'gap',
      caption: (d) => gapText(d),
      log: (d) => [{ text: `gap ${n(last(d.val) - last(d.train))}` }],
    },
    {
      id: 'best',
      caption: (d) => `The lowest validation loss is ${n(d.bestVal)} at epoch ${d.bestEpoch}: the version of the model to keep.`,
      log: (d) => [{ text: 'best epoch ' }, { text: String(d.bestEpoch), hue: 'green' }],
    },
    {
      id: 'epoch',
      caption: (d) => `At epoch ${d.epoch}: training ${n(d.train[d.epoch]!)}, validation ${n(d.val[d.epoch]!)}. Move the epoch slider to read any point.`,
      log: (d) => [{ text: `epoch ${d.epoch}: ${n(d.train[d.epoch]!)} / ${n(d.val[d.epoch]!)}` }],
    },
    {
      id: 'diagnosis',
      caption: (d) => diagnosis[d.scenario](d),
      log: (d) => [{ text: d.scenario, hue: d.scenario === 'healthy' ? 'green' : 'rose' }],
    },
  ],

  readouts: (d) => [
    { tex: '\\text{train}', value: d.train[d.epoch]!, hue: 'blue', digits: 2 },
    { tex: '\\text{validation}', value: d.val[d.epoch]!, hue: 'rose', digits: 2 },
    { tex: '\\text{best epoch}', value: d.bestEpoch, hue: 'green', digits: 0 },
    { tex: '\\text{best val}', value: d.bestVal, hue: 'green', digits: 2 },
  ],
  formula: () => `\\text{gap} = L_{\\text{val}} - L_{\\text{train}}`,

  build(ctx) {
    const { el, step } = ctx

    step('axes', 0)
    fadeIn(ctx, el('axes'), 0, 0.45)
    riseIn(ctx, el('legend'), 0.2, 0.3)

    step('train', 1.2)
    drawIn(ctx, el('train'), 1.2, 1.2, 'power1.inOut')
    activate(ctx, el('train-hit'), 2.4)

    step('val', 3.2)
    drawIn(ctx, el('val'), 3.2, 1.2, 'power1.inOut')
    activate(ctx, el('val-hit'), 4.4)

    step('gap', 5.2)
    fadeIn(ctx, el('gap'), 5.2, 0.5, 0.1)

    step('best', 6.6)
    popIn(ctx, el('best'), 6.6, 0.3)

    step('epoch', 8.0)
    fadeIn(ctx, el('cur'), 8.0, 0.35)
    activate(ctx, el('cur-hit'), 8.2)

    step('diagnosis', 9.4)
    holdUntil(ctx, 11.0)
  },
})
