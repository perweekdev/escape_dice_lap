import Phaser from 'phaser'
import type { LevelDef } from '../data/levels'
import { COLORS } from '../../constants'
import DicePickup from '../entities/DicePickup'
import Hazard from '../entities/Hazard'

export interface LevelObjects {
  staticPlatforms: Phaser.Physics.Arcade.StaticGroup
  movingPlatforms: Phaser.Physics.Arcade.Group
  crumblePlatforms: Phaser.Physics.Arcade.StaticGroup
  hazards: Phaser.GameObjects.GameObject[]
  dice: DicePickup | null
  exit: Phaser.GameObjects.Rectangle
  crumbleRects: Map<Phaser.GameObjects.Rectangle, { delay: number; fallen: boolean }>
}

export function loadLevel(scene: Phaser.Scene, def: LevelDef, diceCollected: boolean): LevelObjects {
  // draw grid bg
  const g = scene.add.graphics().setScrollFactor(0).setDepth(-10)
  g.fillStyle(COLORS.BG)
  g.fillRect(0, 0, def.worldWidth, def.worldHeight)

  // world grid lines
  const wg = scene.add.graphics().setDepth(-9)
  wg.lineStyle(1, 0x0d2a3e, 0.4)
  for (let x = 0; x <= def.worldWidth; x += 40) {
    wg.lineBetween(x, 0, x, def.worldHeight)
  }
  for (let y = 0; y <= def.worldHeight; y += 40) {
    wg.lineBetween(0, y, def.worldWidth, y)
  }

  const staticPlatforms = scene.physics.add.staticGroup()
  const movingPlatforms = scene.physics.add.group({ runChildUpdate: true })
  const crumblePlatforms = scene.physics.add.staticGroup()
  const crumbleRects = new Map<Phaser.GameObjects.Rectangle, { delay: number; fallen: boolean }>()
  const hazardsArr: Phaser.GameObjects.GameObject[] = []

  for (const p of def.platforms) {
    if (p.kind === 'moving') {
      const rect = scene.add.rectangle(p.x + p.width / 2, p.y + p.height / 2, p.width, p.height, COLORS.PLATFORM)
      rect.setStrokeStyle(1, COLORS.PLATFORM_EDGE)
      scene.physics.add.existing(rect)
      const body = rect.body as Phaser.Physics.Arcade.Body
      body.setImmovable(true)
      body.setAllowGravity(false)

      const startX = p.x + p.width / 2
      const startY = p.y + p.height / 2
      if (p.moveAxis === 'x') {
        scene.tweens.add({
          targets: rect,
          x: startX + (p.moveRange ?? 100),
          duration: ((p.moveRange ?? 100) * 2000) / (p.moveSpeed ?? 80),
          yoyo: true,
          repeat: -1,
          ease: 'Linear',
          onUpdate: () => body.reset(rect.x, rect.y),
        })
      } else {
        scene.tweens.add({
          targets: rect,
          y: startY + (p.moveRange ?? 80),
          duration: ((p.moveRange ?? 80) * 2000) / (p.moveSpeed ?? 60),
          yoyo: true,
          repeat: -1,
          ease: 'Linear',
          onUpdate: () => body.reset(rect.x, rect.y),
        })
      }
      movingPlatforms.add(rect)
    } else if (p.kind === 'crumble') {
      const rect = scene.add.rectangle(p.x + p.width / 2, p.y + p.height / 2, p.width, p.height, 0x3a2a1a)
      rect.setStrokeStyle(1, 0xff6600)
      scene.physics.add.existing(rect, true)
      crumblePlatforms.add(rect)
      crumbleRects.set(rect, { delay: p.crumbleDelay ?? 800, fallen: false })
    } else {
      const rect = scene.add.rectangle(p.x + p.width / 2, p.y + p.height / 2, p.width, p.height, COLORS.PLATFORM)
      rect.setStrokeStyle(1, COLORS.PLATFORM_EDGE)
      scene.physics.add.existing(rect, true)
      staticPlatforms.add(rect)
    }
  }

  // hazards
  for (const h of def.hazards) {
    const hazard = new Hazard(scene, h)
    hazardsArr.push(hazard)
  }

  // dice
  let dice: DicePickup | null = null
  if (!diceCollected) {
    dice = new DicePickup(scene, def.dice.x, def.dice.y)
  }

  // exit
  const e = def.exit
  const exit = scene.add.rectangle(e.x + e.width / 2, e.y + e.height / 2, e.width, e.height, COLORS.EXIT, 0.3)
  exit.setStrokeStyle(2, COLORS.EXIT)
  scene.physics.add.existing(exit, true)

  // exit label
  scene.add.text(e.x + e.width / 2, e.y - 14, 'EXIT', {
    fontSize: '9px',
    color: '#00ff88',
    fontFamily: 'monospace',
  }).setOrigin(0.5)

  return { staticPlatforms, movingPlatforms, crumblePlatforms, hazards: hazardsArr, dice, exit, crumbleRects }
}
