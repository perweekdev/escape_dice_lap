export type ModuleKind = 'speed' | 'jump' | 'gravity' | 'dash' | 'shield' | 'unknown'
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
  { kind: 'speed', weight: 17 },
  { kind: 'jump', weight: 17 },
  { kind: 'gravity', weight: 17 },
  { kind: 'dash', weight: 17 },
  { kind: 'shield', weight: 17 },
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

function randomVariant(): ModuleVariant {
  return Math.random() < 0.5 ? 'positive' : 'negative'
}

const MODULE_COLORS: Record<ModuleKind, number> = {
  speed: 0xffaa00,
  jump: 0x00ccff,
  gravity: 0xaa44ff,
  dash: 0xff6600,
  shield: 0x44ff88,
  unknown: 0xffffff,
}

const CHARGES: Record<ModuleKind, number> = {
  speed: 5,
  jump: 5,
  gravity: 3,
  dash: 2,
  shield: 2,
  unknown: 0,
}

function makeLabel(kind: ModuleKind, variant: ModuleVariant): string {
  const sign = variant === 'positive' ? '+' : '-'
  const names: Record<ModuleKind, string> = {
    speed: 'SPEED',
    jump: 'JUMP',
    gravity: 'GRAV',
    dash: 'DASH',
    shield: 'SHLD',
    unknown: '???',
  }
  if (kind === 'unknown') return '???'
  return `${names[kind]}${sign}`
}

function makeDescription(kind: ModuleKind, variant: ModuleVariant): string {
  const map: Record<ModuleKind, Record<ModuleVariant, string>> = {
    speed: { positive: 'Speed +50%', negative: 'Speed -30%' },
    jump: { positive: 'Jump +40%', negative: 'Jump -40%' },
    gravity: { positive: 'Low gravity', negative: 'Heavy gravity' },
    dash: { positive: 'Dash forward', negative: 'Dash backward' },
    shield: { positive: 'Block 1 death', negative: 'Instant fail' },
    unknown: { positive: '???', negative: '???' },
  }
  return map[kind][variant]
}

export function rollModule(): ModuleDef {
  const kind = weightedRandom()
  const variant = randomVariant()

  if (kind === 'unknown') {
    const resolvedKind = weightedRandom() === 'unknown' ? 'speed' : weightedRandom()
    const resolvedVariant = randomVariant()
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
