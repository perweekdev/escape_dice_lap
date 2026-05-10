import type { ModuleDef } from '../data/modules'
import { resolveUnknown } from '../data/modules'
import { MAX_MODULE_SLOTS } from '../../constants'
import Player from '../entities/Player'
import { GRAVITY } from '../../constants'

interface ActiveEffect {
  slotIndex: number
  category: string
  removeFn: (p: Player) => void
  timerId?: ReturnType<typeof setTimeout>
}

export default class ModuleSystem {
  slots: (ModuleDef | null)[] = new Array(MAX_MODULE_SLOTS).fill(null)
  private effects: Map<string, ActiveEffect> = new Map()

  addModule(def: ModuleDef): number {
    const idx = this.slots.findIndex(s => s === null)
    if (idx === -1) return -1
    this.slots[idx] = def
    return idx
  }

  activateSlot(index: number, player: Player, onBanner: (text: string) => void): boolean {
    const mod = this.slots[index]
    if (!mod || mod.charges <= 0) return false

    let resolved = mod
    let bannerText = mod.label

    if (mod.kind === 'unknown') {
      resolved = resolveUnknown(mod)
      this.slots[index] = { ...resolved }
      bannerText = `REVEALED: ${resolved.label}`
    }

    this.slots[index] = { ...resolved, charges: resolved.charges - 1 }
    onBanner(bannerText)

    this.removeEffectByCategory(resolved.kind === 'unknown' ? 'unknown' : resolved.kind, player)

    if (resolved.kind === 'dash') {
      player.dash()
      return true
    }

    if (resolved.kind === 'shield') {
      if (resolved.variant === 'positive') {
        player.activateShield()
      }
      return true
    }

    const effect = this.buildEffect(index, resolved, player)
    if (effect) {
      this.effects.set(resolved.kind === 'unknown' ? `unknown_${index}` : resolved.kind, effect)
      effect.removeFn // stored
    }

    return true
  }

  private buildEffect(index: number, mod: ModuleDef, player: Player): ActiveEffect | null {
    const DURATION = mod.kind === 'gravity' ? 8000 : 8000
    let removeFn: (p: Player) => void

    switch (mod.kind) {
      case 'speed':
        player.speedMult = mod.variant === 'positive' ? 1.5 : 0.65
        removeFn = (p) => { p.speedMult = 1 }
        break
      case 'jump':
        player.jumpMult = mod.variant === 'positive' ? 1.4 : 0.6
        removeFn = (p) => { p.jumpMult = 1 }
        break
      case 'gravity':
        if (mod.variant === 'positive') {
          ;(player.body as Phaser.Physics.Arcade.Body).setGravityY(-GRAVITY * 0.55)
        } else {
          ;(player.body as Phaser.Physics.Arcade.Body).setGravityY(GRAVITY * 0.8)
        }
        removeFn = (p) => { (p.body as Phaser.Physics.Arcade.Body).setGravityY(0) }
        break
      default:
        return null
    }

    const timerId = setTimeout(() => {
      removeFn(player)
      this.effects.delete(mod.kind)
    }, DURATION)

    return { slotIndex: index, category: mod.kind, removeFn, timerId }
  }

  private removeEffectByCategory(category: string, player: Player) {
    const existing = this.effects.get(category)
    if (existing) {
      clearTimeout(existing.timerId)
      existing.removeFn(player)
      this.effects.delete(category)
    }
  }

  onPlayerDeath(player: Player): boolean {
    return player.absorbDeath()
  }

  clearAllEffects(player: Player) {
    for (const effect of this.effects.values()) {
      clearTimeout(effect.timerId)
      effect.removeFn(player)
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
