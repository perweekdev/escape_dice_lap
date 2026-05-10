import Phaser from 'phaser'
import { CANVAS_WIDTH, COLORS, MAX_MODULE_SLOTS } from '../../constants'
import type { ModuleDef } from '../data/modules'
import { EventBus, Events } from '../EventBus'

const TOP_BAR_H = 80

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
    // top bar bg (two rows)
    this.add.rectangle(CANVAS_WIDTH / 2, TOP_BAR_H / 2, CANVAS_WIDTH, TOP_BAR_H, 0x050d1a, 0.92)
    // bottom border line
    this.add.rectangle(CANVAS_WIDTH / 2, TOP_BAR_H, CANVAS_WIDTH, 2, COLORS.PLATFORM_EDGE, 0.3)

    // Row 1: stage | timer | deaths
    this.stageText = this.add.text(12, 8, 'STAGE 1: INIT ZONE', {
      fontSize: '11px', color: '#557799', fontFamily: 'monospace',
    })

    this.timerText = this.add.text(CANVAS_WIDTH / 2, 8, '0:00 / 15:00', {
      fontSize: '14px', color: '#00ffcc', fontFamily: 'monospace',
    }).setOrigin(0.5, 0)

    this.deathText = this.add.text(CANVAS_WIDTH - 12, 8, 'DEATHS: 0', {
      fontSize: '11px', color: '#ff3366', fontFamily: 'monospace',
    }).setOrigin(1, 0)

    // Row 2: module slots (evenly spaced)
    const slotW = CANVAS_WIDTH / MAX_MODULE_SLOTS
    for (let i = 0; i < MAX_MODULE_SLOTS; i++) {
      const cx = slotW * i + slotW / 2
      const container = this.createSlot(cx, TOP_BAR_H - 22, i + 1)
      this.moduleSlots.push(container)
    }

    // divider between rows
    this.add.rectangle(CANVAS_WIDTH / 2, TOP_BAR_H / 2 + 2, CANVAS_WIDTH, 1, 0x0d2a3e)

    // center banner
    this.bannerText = this.add.text(CANVAS_WIDTH / 2, TOP_BAR_H + 30, '', {
      fontSize: '15px', color: '#ffffff', fontFamily: 'monospace',
      backgroundColor: '#0a0a1acc',
      padding: { x: 14, y: 6 },
    }).setOrigin(0.5).setDepth(10).setAlpha(0)
  }

  private createSlot(x: number, y: number, num: number): Phaser.GameObjects.Container {
    const c = this.add.container(x, y)

    const bg = this.add.rectangle(0, 0, CANVAS_WIDTH / MAX_MODULE_SLOTS - 4, 28, COLORS.MODULE_EMPTY)
    bg.setStrokeStyle(1, 0x1a3a5a)

    const numLabel = this.add.text(-(CANVAS_WIDTH / MAX_MODULE_SLOTS / 2) + 6, -10, `[${num}]`, {
      fontSize: '8px', color: '#334455', fontFamily: 'monospace',
    })

    const kindLabel = this.add.text(0, -3, '---', {
      fontSize: '10px', color: '#334455', fontFamily: 'monospace',
    }).setOrigin(0.5, 0)

    const chargeLabel = this.add.text((CANVAS_WIDTH / MAX_MODULE_SLOTS / 2) - 6, -10, '', {
      fontSize: '8px', color: '#334455', fontFamily: 'monospace',
    }).setOrigin(1, 0)

    c.add([bg, numLabel, kindLabel, chargeLabel])
    return c
  }

  private subscribeEvents() {
    EventBus.on(Events.TIMER_UPDATED, (data: { elapsed: string; remaining: string; warning: boolean }) => {
      this.timerText.setText(`${data.elapsed} / 15:00`)
      this.timerText.setColor(data.warning ? '#ff3300' : '#00ffcc')
      if (data.warning) this.timerText.setFontSize('15px')
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
      const children = container.getAll()
      const bg = children[0] as Phaser.GameObjects.Rectangle
      const kindLabel = children[2] as Phaser.GameObjects.Text
      const chargeLabel = children[3] as Phaser.GameObjects.Text

      if (!mod || mod.charges <= 0) {
        bg.setFillStyle(COLORS.MODULE_EMPTY).setStrokeStyle(1, 0x1a3a5a)
        kindLabel.setText('---').setColor('#334455')
        chargeLabel.setText('')
      } else {
        const hexStr = '#' + mod.color.toString(16).padStart(6, '0')
        bg.setFillStyle(mod.color, 0.18).setStrokeStyle(1, mod.color)
        kindLabel.setText(mod.label).setColor(hexStr)
        chargeLabel.setText(`×${mod.charges}`).setColor(hexStr)
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
