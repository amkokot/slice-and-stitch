export function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value))
}

export function distanceToSegment(point, start, end) {
  const dx = end.x - start.x
  const dy = end.y - start.y
  if (dx === 0 && dy === 0) return Math.hypot(point.x - start.x, point.y - start.y)

  const progress = clamp(
    ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy),
    0,
    1,
  )
  return Math.hypot(
    point.x - (start.x + progress * dx),
    point.y - (start.y + progress * dy),
  )
}

export function scoreTrace(points, guide, tolerance = 28) {
  if (points.length < 2 || guide.length < 2) return 0

  const distances = points.map((point) => {
    let closest = Infinity
    for (let index = 1; index < guide.length; index += 1) {
      closest = Math.min(closest, distanceToSegment(point, guide[index - 1], guide[index]))
    }
    return closest
  })

  const accuracy = distances.reduce(
    (total, distance) => total + clamp(1 - distance / tolerance, 0, 1),
    0,
  ) / distances.length

  let visited = 0
  for (let index = 1; index < guide.length; index += 1) {
    const midpoint = {
      x: (guide[index - 1].x + guide[index].x) / 2,
      y: (guide[index - 1].y + guide[index].y) / 2,
    }
    if (points.some((point) => Math.hypot(point.x - midpoint.x, point.y - midpoint.y) <= tolerance * 1.35)) {
      visited += 1
    }
  }

  const coverage = visited / (guide.length - 1)
  return Math.round((accuracy * 0.65 + coverage * 0.35) * 100)
}

export function scoreCoverage(coverage, ideal = 0.78) {
  if (coverage <= ideal) return Math.round(clamp(coverage / ideal, 0, 1) * 100)
  return Math.round(clamp(1 - (coverage - ideal) / Math.max(0.01, 1 - ideal) * 0.28, 0, 1) * 100)
}

export const COVERAGE_QUALIFIERS = Object.freeze({
  light: Object.freeze({ sauce: 0.52, cheese: 0.5, finish: 0.2 }),
  regular: Object.freeze({ sauce: 0.7, cheese: 0.68, finish: 0.3 }),
  extra: Object.freeze({ sauce: 0.84, cheese: 0.82, finish: 0.4 }),
})

export const BAKE_QUALIFIERS = Object.freeze({
  soft: Object.freeze([0.52, 0.62]),
  regular: Object.freeze([0.64, 0.72]),
  crispy: Object.freeze([0.73, 0.81]),
})

export function coverageTargetFor(qualifier = 'regular', kind = 'sauce') {
  const profile = COVERAGE_QUALIFIERS[qualifier] || COVERAGE_QUALIFIERS.regular
  return profile[kind] ?? COVERAGE_QUALIFIERS.regular[kind] ?? 0.7
}

export function countTargetFor(baseCount, qualifier = 'regular') {
  if (qualifier === 'light') return Math.max(1, baseCount - (baseCount >= 6 ? 2 : 1))
  if (qualifier === 'extra') return baseCount + (baseCount >= 6 ? 2 : 1)
  return baseCount
}

export function bakeWindowFor(qualifier = 'regular') {
  return BAKE_QUALIFIERS[qualifier] || BAKE_QUALIFIERS.regular
}

export function scoreToppings(required, placed) {
  const types = Object.keys(required)
  if (!types.length) return 100

  const score = types.reduce((total, type) => {
    const target = required[type]
    const actual = placed.filter((topping) => topping.type === type).length
    return total + clamp(1 - Math.abs(actual - target) / Math.max(1, target), 0, 1)
  }, 0) / types.length

  const unexpected = placed.filter((topping) => !Object.hasOwn(required, topping.type)).length
  return Math.round(clamp(score - unexpected * 0.08, 0, 1) * 100)
}

export function scoreTiming(progress, perfectStart = 0.63, perfectEnd = 0.72) {
  if (progress >= perfectStart && progress <= perfectEnd) return 100
  if (progress < perfectStart) return Math.round(clamp(progress / perfectStart, 0, 1) * 94)
  return Math.round(clamp(1 - (progress - perfectEnd) / (1 - perfectEnd), 0, 1) * 92)
}

export function scoreCuts(cuts, center = { x: 300, y: 300 }, targetCuts = 3) {
  if (!cuts.length) return 0

  const individual = cuts.map((cut) => {
    const centerDistance = distanceToSegment(center, cut.start, cut.end)
    const length = Math.hypot(cut.end.x - cut.start.x, cut.end.y - cut.start.y)
    const centered = clamp(1 - centerDistance / 65, 0, 1)
    const longEnough = clamp(length / 420, 0, 1)
    return centered * 0.72 + longEnough * 0.28
  })

  const angles = cuts
    .map((cut) => {
      const radians = Math.atan2(cut.end.y - cut.start.y, cut.end.x - cut.start.x)
      const normalized = ((radians * 180 / Math.PI) + 180) % 180
      return normalized
    })
    .sort((a, b) => a - b)

  const desiredCuts = Math.max(1, Math.round(targetCuts))
  const expectedGap = 180 / desiredCuts
  let spacing = cuts.length / desiredCuts
  if (angles.length >= 2) {
    const gaps = angles.map((angle, index) => (
      index === angles.length - 1 ? 180 - angle + angles[0] : angles[index + 1] - angle
    ))
    spacing = gaps.reduce((total, gap) => (
      total + clamp(1 - Math.abs(gap - expectedGap) / expectedGap, 0, 1)
    ), 0) / gaps.length
    spacing *= Math.min(1, cuts.length / desiredCuts)
  }

  const base = individual.reduce((total, value) => total + value, 0) / individual.length
  const count = clamp(1 - Math.abs(cuts.length - desiredCuts) / desiredCuts, 0, 1)
  return Math.round(clamp(base * 0.68 + spacing * 0.22 + count * 0.1, 0, 1) * 100)
}

export function craftQuality({ execution, material, mastery, tools, luck }) {
  return Math.round(clamp(
    execution * 0.4 + material * 0.25 + mastery * 0.15 + tools * 0.15 + luck * 0.05,
    0,
    100,
  ))
}

export function garmentValue({ materialCost, quality, finishing }) {
  return Math.max(materialCost, Math.round(materialCost * 1.35 + quality * 0.58 + finishing * 0.16))
}

export function presentationBonus(quality) {
  return Math.round(clamp(quality * 0.0008, 0, 0.08) * 1000) / 1000
}

export function calculatePayout({ base = 24, foodQuality, speedFactor = 1, presentation = 0 }) {
  const qualityFactor = 0.65 + clamp(foodQuality, 0, 100) / 100 * 0.7
  return Math.round(base * qualityFactor * clamp(speedFactor, 0.75, 1.25) * (1 + clamp(presentation, 0, 0.2)))
}

export function nextPhase(phase) {
  if (phase === 'morning') return 'noon'
  if (phase === 'noon') return 'dusk'
  if (phase === 'dusk') return 'night'
  return 'morning'
}

export function seededValue(seed) {
  let value = Math.abs(Number(seed) || 1) % 2147483647
  value = value || 1
  value = value * 16807 % 2147483647
  return (value - 1) / 2147483646
}
