import Phaser from 'phaser'
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, MAX_MODULE_SLOTS } from '../../constants'
import type { ModuleDef } from '../data/modules'
import { EventBus, Events } from '../EventBus'

export default class UIScene extends Phaser.Scene {
  private timerText!: Phaser.GameObjects.Text
  private stageText!: Phaser.GameObjects.Text
  private deathText!: Phaser.GameObjects.Text
  private moduleSlots: Phaser.GameObjects.Container[] = []
  private bannerText!: Phaser.GameObjects.Text
  private bannerTween?: Phaser.Tweens.Tween

  constructor() {
    super('UIScene')
  }

  create() {
    this.createHUD()
    this.subscribeEvents()
  }

  private createHUD() {
    // top bar bg
    this.add.rectangle(CANVAS_WIDTH / 2, 20, CANVAS_WIDTH, 36, 0x050d1a, 0.9)

    this.stageText = this.add.text(12, 10, 'STAGE 1: INIT ZONE', {
      fontSize: '11px', color: '#557799', fontFamily: 'monospace',
    })

    this.timerText = this.add.text(CANVAS_WIDTH / 2, 10, '0:00 / 15:00', {
      fontSize: '14px', color: '#00ffcc', fontFamily: 'monospace',
    }).setOrigin(0.5, 0)

    this.deathText = this.add.text(CANVAS_WIDTH - 12, 10, 'DEATHS: 0', {
      fontSize: '11px', color: '#ff3366', fontFamily: 'monospace',
    }).setOrigin(1, 0)

    // bottom module bar
    this.add.rectangle(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 28, CANVAS_WIDTH, 50, 0x050d1a, 0.9)

    const slotW = 160
    const startX = (CANVAS_WIDTH - slotW * MAX_MODULE_SLOTS) / 2 + slotW / 2
    for (let i = 0; i < MAX_MODULE_SLOTS; i++) {
      const container = this.createSlot(startX + i * slotW, CANVAS_HEIGHT - 28, i + 1)
      this.moduleSlots.push(container)
    }

    // banner text (center)
    this.bannerText = this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60, '', {
      fontSize: '16px', color: '#ffffff', fontFamily: 'monospace',
      backgroundColor: '#0a0a1a',
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setDepth(10).setAlpha(0)
  }

  private createSlot(x: number, y: number, num: number): Phaser.GameObjects.Container {
    const c = this.add.container(x, y)

    const bg = this.add.rectangle(0, 0, 150, 40, COLORS.MODULE_EMPTY)
    bg.setStrokeStyle(1, 0x1a3a5a)

    const numLabel = this.add.text(-65, -14, `[${num}]`, {
      fontSize: '9px', color: '#334455', fontFamily: 'monospace',
    })

    const kindLabel = this.add.text(0, -6, '---', {
      fontSize: '11px', color: '#334455', fontFamily: 'monospace',
    }).setOrigin(0.5, 0)

    const chargeLabel = this.add.text(60, -6, '', {
      fontSize: '9px', color: '#334455', fontFamily: 'monospace',
    }).setOrigin(1, 0)

    c.add([bg, numLabel, kindLabel, chargeLabel])
    return c
  }

  private subscribeEvents() {
    EventBus.on(Events.TIMER_UPDATED, (data: { elapsed: string; remaining: string; warning: boolean }) => {
      this.timerText.setText(`${data.elapsed} / 15:00`)
      const col = data.warning ? '#ff3300' : '#00ffcc'
      this.timerText.setColor(col)
      if (data.warning) {
        this.timerText.setFontSize('15px')
      }
    })

    EventBus.on(Events.STAGE_CHANGED, (name: string) => {
      this.stageText.setText(name)
    })

    EventBus.on(Events.DEATH_COUNT_UPDATED, (count: number) => {
      this.deathText.setText(`DEATHS: ${count}`)
    })

    EventBus.on(Events.MODULE_UPDATED, (slots: (ModuleDef | null)[]) => {
      this.updateModuleSlots(slots)
    })

    EventBus.on(Events.SHOW_BANNER, (text: string) => {
      this.showBanner(text)
    })
  }

  private updateModuleSlots(slots: (ModuleDef | null)[]) {
    slots.forEach((mod, i) => {
      const container = this.moduleSlots[i]
      if (!container) return
      const [bg, , kindLabel, chargeLabel] = container.getAll() as [
        Phaser.GameObjects.Rectangle,
        Phaser.GameObjects.Text,
        Phaser.GameObjects.Text,
        Phaser.GameObjects.Text,
      ]

      if (!mod || mod.charges <= 0) {
        bg.setFillStyle(COLORS.MODULE_EMPTY)
        ;(kindLabel as Phaser.GameObjects.Text).setText('---').setColor('#334455')
        ;(chargeLabel as Phaser.GameObjects.Text).setText('')
      } else {
        bg.setFillStyle(mod.color, 0.15)
        bg.setStrokeStyle(1, mod.color)
        ;(kindLabel as Phaser.GameObjects.Text).setText(mod.label).setColor('#' + mod.color.toString(16).padStart(6, '0'))
        ;(chargeLabel as Phaser.GameObjects.Text).setText(`×${mod.charges}`).setColor('#' + mod.color.toString(16).padStart(6, '0'))
      }
    })
  }

  private showBanner(text: string) {
    this.bannerText.setText(text).setAlpha(1)
    if (this.bannerTween) this.bannerTween.stop()
    this.bannerTween = this.tweens.add({
      targets: this.bannerText,
      alpha: 0,
      delay: 1200,
      duration: 400,
    })
  }

  shutdown() {
    EventBus.removeAllListeners()
  }
}
