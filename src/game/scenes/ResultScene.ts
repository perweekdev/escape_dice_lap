import Phaser from 'phaser'
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../../constants'

interface ResultData {
  outcome: 'win' | 'lose'
  timeMs: number
  deaths: number
}

export default class ResultScene extends Phaser.Scene {
  constructor() {
    super('ResultScene')
  }

  init(data: ResultData) {
    if (data.outcome === 'win') {
      this.saveScore(data.timeMs, data.deaths)
    }
    this.createUI(data)
  }

  create() {}

  private createUI(data: ResultData) {
    // background
    const g = this.add.graphics()
    g.fillStyle(COLORS.BG)
    g.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    g.lineStyle(1, 0x0d2a3e, 0.4)
    for (let x = 0; x < CANVAS_WIDTH; x += 40) g.lineBetween(x, 0, x, CANVAS_HEIGHT)
    for (let y = 0; y < CANVAS_HEIGHT; y += 40) g.lineBetween(0, y, CANVAS_WIDTH, y)

    if (data.outcome === 'win') {
      this.createWinUI(data)
    } else {
      this.createLoseUI(data)
    }

    // buttons
    this.createButton(CANVAS_WIDTH / 2 - 100, CANVAS_HEIGHT - 80, 'RETRY', () => {
      this.scene.start('GameScene')
    })
    this.createButton(CANVAS_WIDTH / 2 + 100, CANVAS_HEIGHT - 80, 'MENU', () => {
      this.scene.start('MenuScene')
    })

    this.input.keyboard!.on('keydown-R', () => this.scene.start('GameScene'))
    this.input.keyboard!.on('keydown-M', () => this.scene.start('MenuScene'))
    this.input.keyboard!.on('keydown-ENTER', () => this.scene.start('GameScene'))
  }

  private createWinUI(data: ResultData) {
    this.add.text(CANVAS_WIDTH / 2, 80, 'ESCAPE SUCCESSFUL', {
      fontSize: '32px', color: '#00ff88', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5)

    this.add.text(CANVAS_WIDTH / 2, 130, '[ EXPERIMENT SUBJECT HAS BREACHED CONTAINMENT ]', {
      fontSize: '10px', color: '#334455', fontFamily: 'monospace',
    }).setOrigin(0.5)

    this.add.text(CANVAS_WIDTH / 2, 200, `TIME: ${this.formatMs(data.timeMs)}`, {
      fontSize: '28px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5)

    this.add.text(CANVAS_WIDTH / 2, 245, `DEATHS: ${data.deaths}`, {
      fontSize: '18px', color: data.deaths === 0 ? '#ffdd00' : '#ff6666', fontFamily: 'monospace',
    }).setOrigin(0.5)

    this.showLeaderboard(data.timeMs)
  }

  private createLoseUI(data: ResultData) {
    const warningText = this.add.text(CANVAS_WIDTH / 2, 120, 'EXPERIMENT SUBJECT', {
      fontSize: '20px', color: '#ff3300', fontFamily: 'monospace',
    }).setOrigin(0.5)

    this.add.text(CANVAS_WIDTH / 2, 155, 'AUTOMATICALLY QUARANTINED', {
      fontSize: '28px', color: '#ff3300', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5)

    this.tweens.add({
      targets: warningText,
      alpha: 0,
      duration: 400,
      yoyo: true,
      repeat: -1,
    })

    this.add.text(CANVAS_WIDTH / 2, 230, `TIME ELAPSED: ${this.formatMs(data.timeMs)}`, {
      fontSize: '16px', color: '#557799', fontFamily: 'monospace',
    }).setOrigin(0.5)

    this.add.text(CANVAS_WIDTH / 2, 260, `DEATHS: ${data.deaths}`, {
      fontSize: '16px', color: '#557799', fontFamily: 'monospace',
    }).setOrigin(0.5)

    this.add.text(CANVAS_WIDTH / 2, 310, '[ SYSTEM: REBOOTING EXPERIMENT PROTOCOL ]', {
      fontSize: '10px', color: '#334455', fontFamily: 'monospace',
    }).setOrigin(0.5)
  }

  private showLeaderboard(currentTimeMs: number) {
    const scores = this.loadScores()
    const startY = 300

    this.add.text(CANVAS_WIDTH / 2, startY, '— RECORDS —', {
      fontSize: '11px', color: '#446688', fontFamily: 'monospace', letterSpacing: 2,
    }).setOrigin(0.5)

    scores.slice(0, 5).forEach((s, i) => {
      const isNew = s.timeMs === currentTimeMs && i === scores.findIndex(x => x.timeMs === currentTimeMs)
      const color = isNew ? '#00ff88' : (i === 0 ? '#ffdd00' : '#557799')
      const row = `${isNew ? '▶ ' : '  '}#${i + 1}  ${this.formatMs(s.timeMs)}  [${s.deaths} deaths]`
      this.add.text(CANVAS_WIDTH / 2, startY + 22 + i * 20, row, {
        fontSize: '12px', color, fontFamily: 'monospace',
      }).setOrigin(0.5)
    })
  }

  private createButton(x: number, y: number, text: string, cb: () => void) {
    const btn = this.add.text(x, y, text, {
      fontSize: '16px', color: '#00ffcc', fontFamily: 'monospace',
      backgroundColor: '#0d1a2e', padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    btn.on('pointerover', () => btn.setColor('#ffffff'))
    btn.on('pointerout', () => btn.setColor('#00ffcc'))
    btn.on('pointerup', cb)
    return btn
  }

  private saveScore(timeMs: number, deaths: number) {
    const scores = this.loadScores()
    scores.push({ timeMs, deaths })
    scores.sort((a, b) => a.timeMs - b.timeMs)
    localStorage.setItem('escape_dice_lab_scores', JSON.stringify(scores.slice(0, 5)))
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
