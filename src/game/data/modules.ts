export type ModuleKind = 'speed' | 'jump' | 'gravity' | 'dash' | 'time' | 'unknown'
export type ModuleVariant = 'positive' | 'negative'

export interface ModuleDef {
  kind: ModuleKind
  variant: ModuleVariant
  charges: number
  label: string
  description: string
  color: number
  resolvedKind?: ModuleKind
  resolvedVariant?: ModuleVariant
}

const WEIGHTS: { kind: ModuleKind; weight: number }[] = [
  { kind: 'speed',   weight: 20 },
  { kind: 'jump',    weight: 18 },
  { kind: 'gravity', weight: 18 },
  { kind: 'dash',    weight: 14 },
  { kind: 'time',    weight: 15 },
  { kind: 'unknown', weight: 15 },
]

function weightedRandom(): ModuleKind {
  const total = WEIGHTS.reduce((s, w) => s + w.weight, 0)
  let r = Math.random() * total
  for (const w of WEIGHTS) {
    r -= w.weight
    if (r <= 0) return w.kind
  }
  return 'speed'
}

function randomVariant(kind: ModuleKind): ModuleVariant {
  // jump has no negative variant (always double-jump benefit)
  if (kind === 'jump' || kind === 'dash') return 'positive'
  return Math.random() < 0.5 ? 'positive' : 'negative'
}

const MODULE_COLORS: Record<ModuleKind, number> = {
  speed:   0xffaa00,
  jump:    0x00ccff,
  gravity: 0xaa44ff,
  dash:    0xff6600,
  time:    0x00ff88,
  unknown: 0xffffff,
}

const CHARGES: Record<ModuleKind, number> = {
  speed:   5,
  jump:    3,
  gravity: 3,
  dash:    2,
  time:    2,
  unknown: 0,
}

function makeLabel(kind: ModuleKind, variant: ModuleVariant): string {
  const names: Record<ModuleKind, string> = {
    speed:   'SPEED',
    jump:    'JUMP×2',
    gravity: 'GRAV',
    dash:    'DASH',
    time:    'TIME',
    unknown: '???',
  }
  if (kind === 'unknown') return '???'
  if (kind === 'jump') return 'JUMP×2'   // always double-jump, no sign
  const sign = variant === 'positive' ? '+' : '-'
  return `${names[kind]}${sign}`
}

function makeDescription(kind: ModuleKind, variant: ModuleVariant): string {
  const map: Partial<Record<ModuleKind, Partial<Record<ModuleVariant, string>>>> = {
    speed:   { positive: 'Speed ×1.5 / 8s', negative: 'Speed ×0.65 / 8s' },
    jump:    { positive: 'Double jump / 8s' },
    gravity: { positive: 'Low gravity / 8s', negative: 'Heavy gravity / 8s' },
    dash:    { positive: 'Dash forward ×700' },
    time:    { positive: 'Slow motion ×0.5 / 8s', negative: 'Fast forward ×2 / 8s' },
    unknown: { positive: '???', negative: '???' },
  }
  return map[kind]?.[variant] ?? '???'
}

export function rollModule(): ModuleDef {
  const kind = weightedRandom()
  const variant = randomVariant(kind)

  if (kind === 'unknown') {
    let resolvedKind = weightedRandom()
    if (resolvedKind === 'unknown') resolvedKind = 'speed'
    const resolvedVariant = randomVariant(resolvedKind)
    const resolvedCharges = CHARGES[resolvedKind] || 3
    return {
      kind: 'unknown',
      variant: 'positive',
      charges: resolvedCharges,
      label: '???',
      description: 'Unknown effect',
      color: MODULE_COLORS.unknown,
      resolvedKind,
      resolvedVariant,
    }
  }

  return {
    kind,
    variant,
    charges: CHARGES[kind],
    label: makeLabel(kind, variant),
    description: makeDescription(kind, variant),
    color: MODULE_COLORS[kind],
  }
}

export function resolveUnknown(mod: ModuleDef): ModuleDef {
  if (mod.kind !== 'unknown' || !mod.resolvedKind) return mod
  const k = mod.resolvedKind
  const v = mod.resolvedVariant ?? 'positive'
  return {
    ...mod,
    kind: k,
    variant: v,
    label: makeLabel(k, v),
    description: makeDescription(k, v),
    color: MODULE_COLORS[k],
  }
}
