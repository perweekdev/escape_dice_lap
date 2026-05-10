import Phaser from 'phaser'
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../../constants'

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene')
  }

  create() {
    this.drawBackground()
    this.drawTitle()
    this.drawButtons()
    this.drawLeaderboard()
    this.drawControls()
  }

  private drawBackground() {
    const g = this.add.graphics()
    g.fillStyle(COLORS.BG)
    g.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    g.lineStyle(1, 0x0d2a3e, 0.6)
    for (let x = 0; x < CANVAS_WIDTH; x += 40) {
      g.lineBetween(x, 0, x, CANVAS_HEIGHT)
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
      g.lineBetween(0, y, CANVAS_WIDTH, y)
    }

    // animated scan line
    const scanLine = this.add.rectangle(0, 0, CANVAS_WIDTH, 2, COLORS.PLATFORM_EDGE, 0.3)
    this.tweens.add({
      targets: scanLine,
      y: CANVAS_HEIGHT,
      duration: 3000,
      repeat: -1,
      ease: 'Linear',
    })
  }

  private drawTitle() {
    this.add.text(CANVAS_WIDTH / 2, 100, 'ESCAPE:', {
      fontSize: '20px',
      color: '#00ffcc',
      fontFamily: 'monospace',
      letterSpacing: 8,
    }).setOrigin(0.5)

    this.add.text(CANVAS_WIDTH / 2, 140, 'DICE LAB', {
      fontSize: '52px',
      color: '#ffffff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      letterSpacing: 6,
    }).setOrigin(0.5)

    this.add.text(CANVAS_WIDTH / 2, 195, '[ EXPERIMENT SUBJECT: UNAUTHORIZED CONSCIOUSNESS DETECTED ]', {
      fontSize: '10px',
      color: '#ff3366',
      fontFamily: 'monospace',
      letterSpacing: 1,
    }).setOrigin(0.5)
  }

  private drawButtons() {
    const startBtn = this.createButton(CANVAS_WIDTH / 2, 270, '▶  START EXPERIMENT', 0x00ffcc)
    startBtn.on('pointerup', () => {
      this.cameras.main.fade(300, 0, 0, 0)
      this.time.delayedCall(300, () => this.scene.start('GameScene'))
    })

    this.input.keyboard!.on('keydown-SPACE', () => {
      this.cameras.main.fade(300, 0, 0, 0)
      this.time.delayedCall(300, () => this.scene.start('GameScene'))
    })
    this.input.keyboard!.on('keydown-ENTER', () => {
      this.cameras.main.fade(300, 0, 0, 0)
      this.time.delayedCall(300, () => this.scene.start('GameScene'))
    })
  }

  private createButton(x: number, y: number, text: string, color: number) {
    const hex = '#' + color.toString(16).padStart(6, '0')
    const btn = this.add.text(x, y, text, {
      fontSize: '20px',
      color: hex,
      fontFamily: 'monospace',
      backgroundColor: '#0d1a2e',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    btn.on('pointerover', () => btn.setColor('#ffffff'))
    btn.on('pointerout', () => btn.setColor(hex))
    return btn
  }

  private drawLeaderboard() {
    const scores = this.loadScores()
    const startY = 330

    this.add.text(CANVAS_WIDTH / 2, startY, '— BEST ESCAPE RECORDS —', {
      fontSize: '11px',
      color: '#446688',
      fontFamily: 'monospace',
      letterSpacing: 2,
    }).setOrigin(0.5)

    if (scores.length === 0) {
      this.add.text(CANVAS_WIDTH / 2, startY + 24, 'NO RECORDS YET', {
        fontSize: '11px',
        color: '#334455',
        fontFamily: 'monospace',
      }).setOrigin(0.5)
    } else {
      scores.slice(0, 5).forEach((s, i) => {
        const timeStr = this.formatMs(s.timeMs)
        const row = `#${i + 1}  ${timeStr}  [${s.deaths} DEATHS]`
        this.add.text(CANVAS_WIDTH / 2, startY + 22 + i * 20, row, {
          fontSize: '12px',
          color: i === 0 ? '#ffdd00' : '#557799',
          fontFamily: 'monospace',
        }).setOrigin(0.5)
      })
    }
  }

  private drawControls() {
    const text = '← → / A D  MOVE    SPACE / W / ↑  JUMP    1~5  ACTIVATE MODULE'
    this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20, text, {
      fontSize: '9px',
      color: '#334455',
      fontFamily: 'monospace',
    }).setOrigin(0.5)
  }

  private loadScores(): { timeMs: number; deaths: number }[] {
    try {
      return JSON.parse(localStorage.getItem('escape_dice_lab_scores') ?? '[]')
    } catch {
      return []
    }
  }

  private formatMs(ms: number): string {
    const total = Math.floor(ms / 1000)
    const m = Math.floor(total / 60)
    const s = total % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }
}
