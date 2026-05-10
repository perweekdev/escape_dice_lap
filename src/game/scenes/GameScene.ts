import Phaser from 'phaser'
import { LEVELS } from '../data/levels'
import { loadLevel, updateMovingPlatforms } from '../systems/LevelLoader'
import type { LevelObjects } from '../systems/LevelLoader'
import { rollModule } from '../data/modules'
import DicePickup from '../entities/DicePickup'
import Player from '../entities/Player'
import ModuleSystem from '../systems/ModuleSystem'
import TimerSystem from '../systems/TimerSystem'
import { EventBus, Events } from '../EventBus'
import { soundSystem } from '../systems/SoundSystem'

export default class GameScene extends Phaser.Scene {
  private player!: Player
  private moduleSystem!: ModuleSystem
  private timerSystem!: TimerSystem
  private levelObjects!: LevelObjects
  private currentLevelIdx = 0
  private diceCollectedPerLevel: boolean[] = [false, false, false, false, false]
  private diceSourceMap: Map<number, number> = new Map()

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
    this.diceSourceMap = new Map()
    this.isDying = false
    this.isTransitioning = false
    this.numberKeys = []

    this.moduleSystem = new ModuleSystem()
    this.timerSystem = new TimerSystem()

    this.cursors = this.input.keyboard!.createCursorKeys()
    this.wasd = {
      left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
    }
    for (let i = 0; i < 5; i++) {
      this.numberKeys.push(this.input.keyboard!.addKey(49 + i))
    }

    this.loadCurrentLevel()
    this.scene.launch('UIScene')
    this.time.delayedCall(0, () => {
      EventBus.emit(Events.STAGE_CHANGED, `STAGE 1: ${LEVELS[0].name}`)
      EventBus.emit(Events.MODULE_UPDATED, this.moduleSystem.slots)
      EventBus.emit(Events.DEATH_COUNT_UPDATED, 0)
    })
  }

  private loadCurrentLevel() {
    if (this.levelObjects) {
      this.cleanLevel()
    }
    const def = LEVELS[this.currentLevelIdx]
    this.physics.world.setBounds(0, 0, def.worldWidth, def.worldHeight)
    this.cameras.main.setBounds(0, 0, def.worldWidth, def.worldHeight)
    this.levelObjects = loadLevel(this, def, this.diceCollectedPerLevel[this.currentLevelIdx])

    if (this.player) this.player.destroy()
    this.player = new Player(this, def.spawnX, def.spawnY)
    this.player.onJump = () => soundSystem.jump()
    this.player.onLand = () => soundSystem.land()
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12)
    this.cameras.main.setFollowOffset(0, -40)
    this.cameras.main.setDeadzone(120, 60)
    this.setupCollisions()
  }

  private cleanLevel() {
    // Destroy stale physics colliders to prevent movement freeze on respawn
    this.physics.world.colliders.getActive().forEach(c => c.destroy())
    this.children.getAll().forEach(child => {
      if (child !== this.player) child.destroy()
    })
  }

  private setupDiceOverlap(dice: DicePickup) {
    this.physics.add.overlap(this.player, dice, () => {
      if (dice.collected) return
      dice.collect()
      this.diceCollectedPerLevel[this.currentLevelIdx] = true
      this.levelObjects = { ...this.levelObjects, dice: null }
      const mod = rollModule()
      const idx = this.moduleSystem.addModule(mod)
      if (idx !== -1) {
        this.diceSourceMap.set(idx, this.currentLevelIdx)
        soundSystem.diceCollect()
        EventBus.emit(Events.DICE_COLLECTED, mod)
        EventBus.emit(Events.MODULE_UPDATED, this.moduleSystem.slots)
        EventBus.emit(Events.SHOW_BANNER, `DICE: ${mod.label}`)
      }
    })
  }

  private setupCollisions() {
    const { staticPlatforms, movingPlatforms, crumblePlatforms, hazards, dice, exit } = this.levelObjects

    this.physics.add.collider(this.player, staticPlatforms)

    this.physics.add.collider(this.player, movingPlatforms, (_playerObj, platformObj) => {
      const playerBody = this.player.body as Phaser.Physics.Arcade.Body
      const platBody = (platformObj as Phaser.GameObjects.Rectangle).body as Phaser.Physics.Arcade.Body
      if (playerBody.blocked.down) {
        playerBody.x += platBody.velocity.x * (1 / 60)
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

    if (dice) this.setupDiceOverlap(dice)

    this.physics.add.overlap(this.player, exit, () => {
      if (!this.isTransitioning) this.advanceStage()
    })
  }

  private checkDiceRespawn(slotIndex: number) {
    if (this.moduleSystem.slots[slotIndex] !== null) return
    const sourceStage = this.diceSourceMap.get(slotIndex)
    if (sourceStage === undefined) return

    this.diceSourceMap.delete(slotIndex)
    this.diceCollectedPerLevel[sourceStage] = false

    if (sourceStage === this.currentLevelIdx && !this.levelObjects.dice) {
      const pos = LEVELS[sourceStage].dice
      const newDice = new DicePickup(this, pos.x, pos.y)
      this.levelObjects = { ...this.levelObjects, dice: newDice }
      this.setupDiceOverlap(newDice)
    }
  }

  private triggerDeath() {
    if (this.isDying || this.isTransitioning) return
    this.isDying = true

    soundSystem.death()
    this.cameras.main.shake(200, 0.02)
    this.cameras.main.flash(150, 255, 50, 50)

    const result = this.timerSystem.applyDeathPenalty()
    EventBus.emit(Events.DEATH_COUNT_UPDATED, this.timerSystem.deaths)

    if (result === 'gameover') {
      this.time.delayedCall(400, () => this.endGame('lose'))
      return
    }

    // Save state before clearing effects
    this.moduleSystem.clearAllEffects(this.player)
    const savedModules = this.moduleSystem.serialize()
    const savedDeaths = this.timerSystem.deaths
    const savedElapsed = this.timerSystem.elapsed

    this.time.delayedCall(500, () => {
      // Restore state and respawn on Stage 1
      this.moduleSystem.deserialize(savedModules)
      this.timerSystem.setFromSave(savedDeaths, savedElapsed)
      this.respawn()
      this.isDying = false
    })
  }

  private respawn() {
    this.currentLevelIdx = 0
    this.diceCollectedPerLevel = [false, false, false, false, false]
    this.diceSourceMap = new Map()

    const def = LEVELS[0]
    this.cleanLevel()
    this.physics.world.setBounds(0, 0, def.worldWidth, def.worldHeight)
    this.cameras.main.setBounds(0, 0, def.worldWidth, def.worldHeight)
    this.levelObjects = loadLevel(this, def, false)

    this.player.destroy()
    this.player = new Player(this, def.spawnX, def.spawnY)
    this.player.onJump = () => soundSystem.jump()
    this.player.onLand = () => soundSystem.land()
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12)
    this.cameras.main.setFollowOffset(0, -40)
    this.cameras.main.setDeadzone(120, 60)
    this.setupCollisions()

    EventBus.emit(Events.STAGE_CHANGED, `STAGE 1: ${LEVELS[0].name}`)
    EventBus.emit(Events.MODULE_UPDATED, this.moduleSystem.slots)
    EventBus.emit(Events.DEATH_COUNT_UPDATED, this.timerSystem.deaths)
  }

  private advanceStage() {
    this.isTransitioning = true
    soundSystem.stageClear()
    this.cameras.main.flash(200, 0, 255, 136)

    this.time.delayedCall(300, () => {
      if (this.currentLevelIdx >= LEVELS.length - 1) {
        this.endGame('win')
      } else {
        this.currentLevelIdx++
        this.moduleSystem.clearAllEffects(this.player)
        this.loadCurrentLevel()
        this.isTransitioning = false
        EventBus.emit(Events.STAGE_CHANGED, `STAGE ${this.currentLevelIdx + 1}: ${LEVELS[this.currentLevelIdx].name}`)
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

    if (this.levelObjects?.movingPlatformData) {
      updateMovingPlatforms(this.levelObjects.movingPlatformData)
    }

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

    this.numberKeys.forEach((key, i) => {
      if (Phaser.Input.Keyboard.JustDown(key)) {
        const activated = this.moduleSystem.activateSlot(i, this.player, (text, isNegative) => {
          EventBus.emit(Events.SHOW_BANNER, text)
          if (isNegative) soundSystem.moduleActivateNegative()
          else soundSystem.moduleActivate()
        })
        if (activated) {
          EventBus.emit(Events.MODULE_UPDATED, this.moduleSystem.slots)
          this.checkDiceRespawn(i)
        }
      }
    })

    if (this.timerSystem.isWarning()) soundSystem.warningBeep()

    const body = this.player.body as Phaser.Physics.Arcade.Body
    if (body.y > LEVELS[this.currentLevelIdx].worldHeight + 100) {
      this.triggerDeath()
    }
  }
}
