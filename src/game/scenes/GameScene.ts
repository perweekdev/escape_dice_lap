import Phaser from 'phaser'
import {} from '../../constants'
import { LEVELS } from '../data/levels'
import { loadLevel } from '../systems/LevelLoader'
import type { LevelObjects } from '../systems/LevelLoader'
import { rollModule } from '../data/modules'
import Player from '../entities/Player'
import ModuleSystem from '../systems/ModuleSystem'
import TimerSystem from '../systems/TimerSystem'
import { EventBus, Events } from '../EventBus'

export default class GameScene extends Phaser.Scene {
  private player!: Player
  private moduleSystem!: ModuleSystem
  private timerSystem!: TimerSystem
  private levelObjects!: LevelObjects
  private currentLevelIdx = 0
  private diceCollectedPerLevel: boolean[] = [false, false, false, false, false]

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd!: { left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key; up: Phaser.Input.Keyboard.Key }
  private numberKeys: Phaser.Input.Keyboard.Key[] = []

  private isDying = false
  private isTransitioning = false

  constructor() {
    super('GameScene')
  }

  create() {
    this.currentLevelIdx = 0
    this.diceCollectedPerLevel = [false, false, false, false, false]
    this.isDying = false
    this.isTransitioning = false

    this.moduleSystem = new ModuleSystem()
    this.timerSystem = new TimerSystem()

    this.cursors = this.input.keyboard!.createCursorKeys()
    this.wasd = {
      left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
    }
    // keyCode 49='1' ... 53='5'
    for (let i = 0; i < 5; i++) {
      this.numberKeys.push(this.input.keyboard!.addKey(49 + i))
    }

    this.loadCurrentLevel()
    this.scene.launch('UIScene')
    EventBus.emit(Events.STAGE_CHANGED, LEVELS[this.currentLevelIdx].name)
    EventBus.emit(Events.MODULE_UPDATED, this.moduleSystem.slots)
    EventBus.emit(Events.DEATH_COUNT_UPDATED, 0)
  }

  private loadCurrentLevel() {
    // clean old objects if any
    if (this.levelObjects) {
      this.cleanLevel()
    }

    const def = LEVELS[this.currentLevelIdx]
    this.physics.world.setBounds(0, 0, def.worldWidth, def.worldHeight)
    this.cameras.main.setBounds(0, 0, def.worldWidth, def.worldHeight)

    this.levelObjects = loadLevel(this, def, this.diceCollectedPerLevel[this.currentLevelIdx])

    // player
    if (this.player) {
      this.player.destroy()
    }
    this.player = new Player(this, def.spawnX, def.spawnY)
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12)
    this.cameras.main.setDeadzone(120, 60)

    this.setupCollisions()
  }

  private cleanLevel() {
    this.children.getAll().forEach(child => {
      if (child !== this.player) child.destroy()
    })
  }

  private setupCollisions() {
    const { staticPlatforms, movingPlatforms, crumblePlatforms, hazards, dice, exit } = this.levelObjects

    this.physics.add.collider(this.player, staticPlatforms)
    this.physics.add.collider(this.player, movingPlatforms, (_player, platform) => {
      const p = this.player
      const plat = platform as Phaser.GameObjects.Rectangle
      const platBody = plat.body as Phaser.Physics.Arcade.Body
      const playerBody = p.body as Phaser.Physics.Arcade.Body
      if (playerBody.blocked.down) {
        playerBody.setVelocityX(playerBody.velocity.x + platBody.velocity.x)
      }
    })

    this.physics.add.collider(this.player, crumblePlatforms, (_player, platform) => {
      const rect = platform as Phaser.GameObjects.Rectangle
      const meta = this.levelObjects.crumbleRects.get(rect)
      if (meta && !meta.fallen) {
        meta.fallen = true
        this.time.delayedCall(meta.delay, () => {
          this.tweens.add({ targets: rect, alpha: 0, duration: 200 })
          this.time.delayedCall(200, () => {
            const body = rect.body as Phaser.Physics.Arcade.StaticBody
            body.enable = false
          })
        })
      }
    })

    for (const h of hazards) {
      this.physics.add.overlap(this.player, h, () => {
        const hazard = h as import('../entities/Hazard').default
        if (hazard.isActive) this.triggerDeath()
      })
    }

    if (dice) {
      this.physics.add.overlap(this.player, dice, () => {
        if (dice.collected) return
        dice.collect()
        this.diceCollectedPerLevel[this.currentLevelIdx] = true
        const mod = rollModule()
        const idx = this.moduleSystem.addModule(mod)
        if (idx !== -1) {
          EventBus.emit(Events.DICE_COLLECTED, mod)
          EventBus.emit(Events.MODULE_UPDATED, this.moduleSystem.slots)
          EventBus.emit(Events.SHOW_BANNER, `DICE COLLECTED: ${mod.label}`)
        }
      })
    }

    this.physics.add.overlap(this.player, exit, () => {
      if (!this.isTransitioning) this.advanceStage()
    })
  }

  private triggerDeath() {
    if (this.isDying || this.isTransitioning) return
    this.isDying = true

    this.cameras.main.shake(200, 0.02)
    this.cameras.main.flash(150, 255, 50, 50)

    const result = this.timerSystem.applyDeathPenalty()
    EventBus.emit(Events.DEATH_COUNT_UPDATED, this.timerSystem.deaths)

    if (result === 'gameover') {
      this.time.delayedCall(400, () => this.endGame('lose'))
      return
    }

    this.moduleSystem.clearAllEffects(this.player)
    const savedModules = this.moduleSystem.serialize()

    this.time.delayedCall(400, () => {
      this.moduleSystem.deserialize(savedModules)
      this.respawn()
      this.isDying = false
    })
  }

  private respawn() {
    const def = LEVELS[this.currentLevelIdx]
    // rebuild level (crumble resets) but keep modules
    this.cleanLevel()
    this.physics.world.setBounds(0, 0, def.worldWidth, def.worldHeight)
    this.levelObjects = loadLevel(this, def, this.diceCollectedPerLevel[this.currentLevelIdx])

    this.player.destroy()
    this.player = new Player(this, def.spawnX, def.spawnY)
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12)
    this.cameras.main.setDeadzone(120, 60)
    this.setupCollisions()
    EventBus.emit(Events.MODULE_UPDATED, this.moduleSystem.slots)
  }

  private advanceStage() {
    this.isTransitioning = true
    this.cameras.main.flash(200, 0, 255, 136)

    this.time.delayedCall(300, () => {
      if (this.currentLevelIdx >= LEVELS.length - 1) {
        this.endGame('win')
      } else {
        this.currentLevelIdx++
        this.moduleSystem.clearAllEffects(this.player)
        this.loadCurrentLevel()
        this.isTransitioning = false
        EventBus.emit(Events.STAGE_CHANGED, LEVELS[this.currentLevelIdx].name)
        EventBus.emit(Events.MODULE_UPDATED, this.moduleSystem.slots)
      }
    })
  }

  private endGame(outcome: 'win' | 'lose') {
    this.scene.stop('UIScene')
    this.scene.start('ResultScene', {
      outcome,
      timeMs: this.timerSystem.elapsed,
      deaths: this.timerSystem.deaths,
    })
  }

  update(_time: number, delta: number) {
    if (this.isDying || this.isTransitioning) return

    const result = this.timerSystem.update(delta)
    EventBus.emit(Events.TIMER_UPDATED, {
      elapsed: this.timerSystem.formatElapsed(),
      remaining: this.timerSystem.formatRemaining(),
      warning: this.timerSystem.isWarning(),
    })

    if (result === 'gameover') {
      this.endGame('lose')
      return
    }

    if (!this.player) return
    this.player.handleMovement(this.cursors, this.wasd)

    // module activation
    this.numberKeys.forEach((key, i) => {
      if (Phaser.Input.Keyboard.JustDown(key)) {
        this.moduleSystem.activateSlot(i, this.player, (text) => {
          EventBus.emit(Events.SHOW_BANNER, text)
        })
        EventBus.emit(Events.MODULE_UPDATED, this.moduleSystem.slots)
      }
    })

    // pit fall detection
    const body = this.player.body as Phaser.Physics.Arcade.Body
    if (body.y > LEVELS[this.currentLevelIdx].worldHeight + 100) {
      this.triggerDeath()
    }
  }
}
