import type { ModuleDef } from '../data/modules'
import { resolveUnknown } from '../data/modules'
import { MAX_MODULE_SLOTS, GRAVITY } from '../../constants'
import Player from '../entities/Player'

interface ActiveEffect {
  category: string
  removeFn: (p: Player) => void
  timerId?: ReturnType<typeof setTimeout>
  playerRef: WeakRef<Player>
}

export default class ModuleSystem {
  slots: (ModuleDef | null)[] = new Array(MAX_MODULE_SLOTS).fill(null)
  private effects: Map<string, ActiveEffect> = new Map()

  addModule(def: ModuleDef): number {
    const idx = this.slots.findIndex(s => s === null)
    if (idx === -1) return -1
    this.slots[idx] = { ...def }
    return idx
  }

  activateSlot(
    index: number,
    player: Player,
    onBanner: (text: string, isNegative: boolean) => void,
  ): boolean {
    const mod = this.slots[index]
    if (!mod || mod.charges <= 0) return false

    let resolved = mod
    let bannerText = mod.label
    let isNegative = mod.variant === 'negative'

    if (mod.kind === 'unknown') {
      resolved = resolveUnknown(mod)
      this.slots[index] = { ...resolved }
      bannerText = `REVEALED: ${resolved.label}`
      isNegative = resolved.variant === 'negative'
    }

    this.slots[index] = { ...resolved, charges: resolved.charges - 1 }
    onBanner(bannerText, isNegative)

    // remove existing effect in same category before applying new one
    this.removeEffectByCategory(resolved.kind, player)

    if (resolved.kind === 'dash') {
      player.dash()
      return true
    }

    if (resolved.kind === 'shield') {
      if (resolved.variant === 'positive') player.activateShield()
      return true
    }

    const effect = this.buildEffect(resolved, player)
    if (effect) {
      this.effects.set(resolved.kind, effect)
    }

    return true
  }

  private buildEffect(mod: ModuleDef, player: Player): ActiveEffect | null {
    const DURATION = 8000
    let removeFn: (p: Player) => void

    switch (mod.kind) {
      case 'speed':
        player.speedMult = mod.variant === 'positive' ? 1.5 : 0.65
        removeFn = (p) => { if (p.active) p.speedMult = 1 }
        break
      case 'jump':
        player.jumpMult = mod.variant === 'positive' ? 1.4 : 0.6
        removeFn = (p) => { if (p.active) p.jumpMult = 1 }
        break
      case 'gravity': {
        const body = player.body as Phaser.Physics.Arcade.Body
        body.setGravityY(mod.variant === 'positive' ? -GRAVITY * 0.55 : GRAVITY * 0.8)
        removeFn = (p) => {
          if (p.active) (p.body as Phaser.Physics.Arcade.Body).setGravityY(0)
        }
        break
      }
      default:
        return null
    }

    const playerRef = new WeakRef(player)
    const category = mod.kind

    const timerId = setTimeout(() => {
      const p = playerRef.deref()
      if (p && p.active) removeFn(p)
      this.effects.delete(category)
    }, DURATION)

    return { category, removeFn, timerId, playerRef }
  }

  private removeEffectByCategory(category: string, player: Player) {
    const existing = this.effects.get(category)
    if (existing) {
      clearTimeout(existing.timerId)
      if (player.active) existing.removeFn(player)
      this.effects.delete(category)
    }
  }

  onPlayerDeath(player: Player): boolean {
    return player.absorbDeath()
  }

  clearAllEffects(player: Player) {
    for (const effect of this.effects.values()) {
      clearTimeout(effect.timerId)
      if (player.active) effect.removeFn(player)
    }
    this.effects.clear()
  }

  serialize(): string {
    return JSON.stringify(this.slots)
  }

  deserialize(data: string) {
    try {
      this.slots = JSON.parse(data)
    } catch {
      this.slots = new Array(MAX_MODULE_SLOTS).fill(null)
    }
  }

  reset() {
    this.slots = new Array(MAX_MODULE_SLOTS).fill(null)
    this.effects.clear()
  }
}
