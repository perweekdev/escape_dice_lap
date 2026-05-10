import Phaser from 'phaser'
import type { LevelDef } from '../data/levels'
import { COLORS } from '../../constants'
import DicePickup from '../entities/DicePickup'
import Hazard from '../entities/Hazard'

export interface MovingPlatformData {
  rect: Phaser.GameObjects.Rectangle
  originX: number
  originY: number
  range: number
  speed: number
  axis: 'x' | 'y'
}

export interface LevelObjects {
  staticPlatforms: Phaser.Physics.Arcade.StaticGroup
  movingPlatforms: Phaser.Physics.Arcade.Group
  crumblePlatforms: Phaser.Physics.Arcade.StaticGroup
  hazards: Phaser.GameObjects.GameObject[]
  dice: DicePickup | null
  exit: Phaser.GameObjects.Rectangle
  crumbleRects: Map<Phaser.GameObjects.Rectangle, { delay: number; fallen: boolean }>
  movingPlatformData: MovingPlatformData[]
}

export function loadLevel(scene: Phaser.Scene, def: LevelDef, diceCollected: boolean): LevelObjects {
  // fixed bg layer (doesn't scroll)
  const g = scene.add.graphics().setScrollFactor(0).setDepth(-10)
  g.fillStyle(COLORS.BG)
  g.fillRect(0, 0, scene.scale.width, scene.scale.height)

  // scrollable grid lines
  const wg = scene.add.graphics().setDepth(-9)
  wg.lineStyle(1, 0x0d2a3e, 0.4)
  for (let x = 0; x <= def.worldWidth; x += 40) {
    wg.lineBetween(x, 0, x, def.worldHeight)
  }
  for (let y = 0; y <= def.worldHeight; y += 40) {
    wg.lineBetween(0, y, def.worldWidth, y)
  }

  const staticPlatforms = scene.physics.add.staticGroup()
  const movingPlatforms = scene.physics.add.group()
  const crumblePlatforms = scene.physics.add.staticGroup()
  const crumbleRects = new Map<Phaser.GameObjects.Rectangle, { delay: number; fallen: boolean }>()
  const hazardsArr: Phaser.GameObjects.GameObject[] = []
  const movingPlatformData: MovingPlatformData[] = []

  for (const p of def.platforms) {
    if (p.kind === 'moving') {
      const rect = scene.add.rectangle(p.x + p.width / 2, p.y + p.height / 2, p.width, p.height, COLORS.PLATFORM)
      rect.setStrokeStyle(1, COLORS.PLATFORM_EDGE)
      scene.physics.add.existing(rect)
      const body = rect.body as Phaser.Physics.Arcade.Body
      body.setImmovable(true)
      body.setAllowGravity(false)
      body.setMaxVelocity(500, 500)

      const speed = p.moveSpeed ?? 80
      // start moving in positive direction
      if (p.moveAxis === 'x') {
        body.setVelocityX(speed)
      } else {
        body.setVelocityY(speed)
      }

      movingPlatformData.push({
        rect,
        originX: p.x + p.width / 2,
        originY: p.y + p.height / 2,
        range: p.moveRange ?? 100,
        speed,
        axis: p.moveAxis ?? 'x',
      })
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

  for (const h of def.hazards) {
    const hazard = new Hazard(scene, h)
    hazardsArr.push(hazard)
  }

  let dice: DicePickup | null = null
  if (!diceCollected) {
    dice = new DicePickup(scene, def.dice.x, def.dice.y)
  }

  const e = def.exit
  const exit = scene.add.rectangle(e.x + e.width / 2, e.y + e.height / 2, e.width, e.height, COLORS.EXIT, 0.3)
  exit.setStrokeStyle(2, COLORS.EXIT)
  scene.physics.add.existing(exit, true)

  scene.add.text(e.x + e.width / 2, e.y - 14, 'EXIT', {
    fontSize: '9px',
    color: '#00ff88',
    fontFamily: 'monospace',
  }).setOrigin(0.5)

  return { staticPlatforms, movingPlatforms, crumblePlatforms, hazards: hazardsArr, dice, exit, crumbleRects, movingPlatformData }
}

// Call this every frame from GameScene.update() to bounce moving platforms
export function updateMovingPlatforms(data: MovingPlatformData[]) {
  for (const d of data) {
    if (!d.rect.active) continue
    const body = d.rect.body as Phaser.Physics.Arcade.Body
    if (d.axis === 'x') {
      if (d.rect.x >= d.originX + d.range) {
        body.setVelocityX(-d.speed)
      } else if (d.rect.x <= d.originX - d.range) {
        body.setVelocityX(d.speed)
      }
    } else {
      if (d.rect.y >= d.originY + d.range) {
        body.setVelocityY(-d.speed)
      } else if (d.rect.y <= d.originY - d.range) {
        body.setVelocityY(d.speed)
      }
    }
  }
}
