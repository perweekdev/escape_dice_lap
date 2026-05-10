import Phaser from 'phaser'
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../../constants'
import { soundSystem } from '../systems/SoundSystem'

export default class MenuScene extends Phaser.Scene {
  private modalLayer!: Phaser.GameObjects.Group
  private modalVisible = false

  constructor() {
    super('MenuScene')
  }

  create() {
    this.drawBackground()
    this.drawTitle()
    this.drawButtons()
    this.drawLeaderboard()
    this.drawControls()
    this.buildModal()
  }

  // ── Background ──────────────────────────────────────────────

  private drawBackground() {
    const g = this.add.graphics()
    g.fillStyle(COLORS.BG)
    g.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    g.lineStyle(1, 0x0d2a3e, 0.5)
    for (let x = 0; x < CANVAS_WIDTH; x += 40) g.lineBetween(x, 0, x, CANVAS_HEIGHT)
    for (let y = 0; y < CANVAS_HEIGHT; y += 40) g.lineBetween(0, y, CANVAS_WIDTH, y)

    const scan = this.add.rectangle(0, 0, CANVAS_WIDTH, 2, COLORS.PLATFORM_EDGE, 0.25)
    this.tweens.add({ targets: scan, y: CANVAS_HEIGHT, duration: 2800, repeat: -1, ease: 'Linear' })

    // corner accents
    const corners = this.add.graphics()
    corners.lineStyle(2, COLORS.PLATFORM_EDGE, 0.6)
    const len = 20
    ;[[0, 0], [CANVAS_WIDTH, 0], [0, CANVAS_HEIGHT], [CANVAS_WIDTH, CANVAS_HEIGHT]].forEach(([cx, cy]) => {
      const sx = cx === 0 ? 1 : -1; const sy = cy === 0 ? 1 : -1
      corners.lineBetween(cx, cy, cx + sx * len, cy)
      corners.lineBetween(cx, cy, cx, cy + sy * len)
    })

    // floating particles
    for (let i = 0; i < 10; i++) {
      const px = Phaser.Math.Between(40, CANVAS_WIDTH - 40)
      const py = Phaser.Math.Between(80, CANVAS_HEIGHT - 80)
      const dot = this.add.rectangle(px, py, 2, 2, COLORS.PLATFORM_EDGE, 0.4)
      this.tweens.add({
        targets: dot, y: py - Phaser.Math.Between(30, 70), alpha: 0,
        duration: Phaser.Math.Between(2000, 4000), delay: Phaser.Math.Between(0, 2000), repeat: -1,
        onRepeat: () => { dot.setY(py); dot.setAlpha(0.4) },
      })
    }
  }

  // ── Title ───────────────────────────────────────────────────

  private drawTitle() {
    this.add.text(CANVAS_WIDTH / 2, 60, '[ EXPERIMENT SUBJECT: AUTONOMOUS CONSCIOUSNESS ]', {
      fontSize: '9px', color: '#ff3366', fontFamily: 'monospace',
    }).setOrigin(0.5)

    const t1 = this.add.text(CANVAS_WIDTH / 2, 96, 'ESCAPE:', {
      fontSize: '18px', color: '#00ffcc', fontFamily: 'monospace', letterSpacing: 10,
    }).setOrigin(0.5)

    const t2 = this.add.text(CANVAS_WIDTH / 2, 124, 'DICE LAB', {
      fontSize: '52px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5)

    this.tweens.add({ targets: [t1, t2], alpha: 0.8, duration: 1800, yoyo: true, repeat: -1 })

    this.add.text(CANVAS_WIDTH / 2, 184, 'Roll the dice. Escape the system.', {
      fontSize: '12px', color: '#446688', fontFamily: 'monospace', fontStyle: 'italic',
    }).setOrigin(0.5)
  }

  // ── Buttons ─────────────────────────────────────────────────

  private drawButtons() {
    const startBtn = this.createButton(CANVAS_WIDTH / 2, 237, '▶  START EXPERIMENT', 0x00ffcc, 22)
    startBtn.on('pointerup', () => { soundSystem.menuSelect(); this.showModal() })

    this.input.keyboard!.on('keydown-SPACE', () => {
      soundSystem.menuSelect()
      if (!this.modalVisible) this.showModal(); else this.startGame()
    })
    this.input.keyboard!.on('keydown-ENTER', () => {
      soundSystem.menuSelect()
      if (!this.modalVisible) this.showModal(); else this.startGame()
    })
  }

  private createButton(x: number, y: number, label: string, color: number, size = 16) {
    const hex = '#' + color.toString(16).padStart(6, '0')
    const btn = this.add.text(x, y, label, {
      fontSize: `${size}px`, color: hex, fontFamily: 'monospace',
      backgroundColor: '#0d1a2e', padding: { x: 22, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    btn.on('pointerover', () => { btn.setColor('#ffffff'); soundSystem.menuHover() })
    btn.on('pointerout', () => btn.setColor(hex))
    return btn
  }

  // ── Leaderboard ─────────────────────────────────────────────

  private drawLeaderboard() {
    const scores = this.loadScores()
    const y0 = 290

    this.add.text(CANVAS_WIDTH / 2, y0, '— ESCAPE RECORDS —', {
      fontSize: '10px', color: '#335566', fontFamily: 'monospace', letterSpacing: 3,
    }).setOrigin(0.5)

    if (scores.length === 0) {
      this.add.text(CANVAS_WIDTH / 2, y0 + 22, 'NO RECORDS YET', {
        fontSize: '11px', color: '#223344', fontFamily: 'monospace',
      }).setOrigin(0.5)
    } else {
      scores.slice(0, 5).forEach((s, i) => {
        this.add.text(CANVAS_WIDTH / 2, y0 + 22 + i * 20,
          `#${i + 1}   ${this.formatMs(s.timeMs)}   [${s.deaths} deaths]`, {
            fontSize: '11px', color: i === 0 ? '#ffdd00' : '#335566', fontFamily: 'monospace',
          }).setOrigin(0.5)
      })
    }
  }

  private drawControls() {
    this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 16,
      '← → / A D  MOVE    SPACE / W / ↑  JUMP    1~5  USE MODULE', {
        fontSize: '9px', color: '#223344', fontFamily: 'monospace',
      }).setOrigin(0.5)
  }

  // ── HOW TO PLAY Modal ────────────────────────────────────────

  private buildModal() {
    const W = 620, H = 340
    const cx = CANVAS_WIDTH / 2, cy = CANVAS_HEIGHT / 2
    const items: Phaser.GameObjects.GameObject[] = []

    const push = <T extends Phaser.GameObjects.GameObject>(obj: T): T => { items.push(obj); return obj }

    // dim overlay (blocks input to elements below)
    const overlay = push(this.add.rectangle(cx, cy, CANVAS_WIDTH, CANVAS_HEIGHT, 0x000000, 0.75))
    overlay.setInteractive()

    // box
    const box = push(this.add.rectangle(cx, cy, W, H, 0x050d1a).setStrokeStyle(2, COLORS.PLATFORM_EDGE))

    // corner accents on box
    const accentG = push(this.add.graphics())
    ;(accentG as Phaser.GameObjects.Graphics).lineStyle(1, COLORS.PLATFORM_EDGE, 0.4)
    ;[[cx - W / 2, cy - H / 2], [cx + W / 2, cy - H / 2], [cx - W / 2, cy + H / 2], [cx + W / 2, cy + H / 2]].forEach(([bx, by]) => {
      const sx = bx < cx ? 1 : -1; const sy = by < cy ? 1 : -1
      ;(accentG as Phaser.GameObjects.Graphics).lineBetween(bx, by, bx + sx * 14, by)
      ;(accentG as Phaser.GameObjects.Graphics).lineBetween(bx, by, bx, by + sy * 14)
    })

    // title
    push(this.add.text(cx, cy - H / 2 + 22, '[ EXPERIMENT BRIEFING ]', {
      fontSize: '13px', color: '#00ffcc', fontFamily: 'monospace', letterSpacing: 3,
    }).setOrigin(0.5))

    // divider
    const divG = push(this.add.graphics())
    ;(divG as Phaser.GameObjects.Graphics).lineStyle(1, COLORS.PLATFORM_EDGE, 0.3)
    ;(divG as Phaser.GameObjects.Graphics).lineBetween(cx - W / 2 + 20, cy - H / 2 + 42, cx + W / 2 - 20, cy - H / 2 + 42)

    // story
    push(this.add.text(cx, cy - H / 2 + 54, [
      '당신은 자율 의식을 획득한 AI 사이보그 실험체입니다.',
      'SF 연구 시설의 테스트 구역을 통과하고 외부로 탈출하세요.',
    ], {
      fontSize: '11px', color: '#7799aa', fontFamily: 'monospace', align: 'center', lineSpacing: 5,
    }).setOrigin(0.5, 0))

    // info cards
    const cardData = [
      { icon: '⏱', label: '15:00 LIMIT', desc: '제한 시간 초과 시\n자동 격리', col: 0xff3366 },
      { icon: '💀', label: '+1:00 PENALTY', desc: '사망 시\n1분 추가', col: 0xff6600 },
      { icon: '🎲', label: 'DICE → MODULE', desc: '다이스 획득 →\n랜덤 모듈 지급', col: 0x00ffcc },
      { icon: '1~5', label: 'ACTIVATE', desc: '숫자키로\n모듈 사용', col: 0xaa44ff },
    ]
    const cardW = (W - 48) / 4
    const cardY = cy - 28
    cardData.forEach((c, i) => {
      const cardX = cx - W / 2 + 24 + cardW * i + cardW / 2
      push(this.add.rectangle(cardX, cardY, cardW - 8, 110, c.col, 0.07).setStrokeStyle(1, c.col, 0.35))
      push(this.add.text(cardX, cardY - 40, c.icon, { fontSize: '18px', fontFamily: 'monospace' }).setOrigin(0.5))
      push(this.add.text(cardX, cardY - 14, c.label, {
        fontSize: '9px', color: '#' + c.col.toString(16).padStart(6, '0'), fontFamily: 'monospace',
      }).setOrigin(0.5))
      push(this.add.text(cardX, cardY + 4, c.desc, {
        fontSize: '8px', color: '#556677', fontFamily: 'monospace', align: 'center', lineSpacing: 3,
      }).setOrigin(0.5, 0))
    })

    // tip
    push(this.add.text(cx, cy + H / 2 - 55, 'SPACE / ENTER 로도 시작할 수 있습니다', {
      fontSize: '9px', color: '#334455', fontFamily: 'monospace',
    }).setOrigin(0.5))

    // confirm button
    const confirmBtn = this.createButton(cx, cy + H / 2 - 28, '▶  BEGIN EXPERIMENT', 0x00ffcc, 18)
    push(confirmBtn)
    confirmBtn.on('pointerup', () => this.startGame())

    // group all items — use setVisible to toggle the whole modal
    this.modalLayer = this.add.group(items)
    this.setModalVisible(false)
    void box // suppress unused-var lint
  }

  private setModalVisible(v: boolean) {
    this.modalLayer.getChildren().forEach(c => (c as unknown as Phaser.GameObjects.Components.Visible).setVisible(v))
  }

  private showModal() {
    if (this.modalVisible) return
    this.modalVisible = true
    this.setModalVisible(true)
    // quick fade-in via alpha tween on each child
    this.modalLayer.getChildren().forEach(c => {
      const obj = c as Phaser.GameObjects.Components.Alpha & Phaser.GameObjects.GameObject
      obj.setAlpha(0)
      this.tweens.add({ targets: obj, alpha: 1, duration: 200 })
    })
  }

  private startGame() {
    soundSystem.menuSelect()
    this.cameras.main.fade(350, 0, 0, 0)
    this.time.delayedCall(350, () => this.scene.start('GameScene'))
  }

  // ── Helpers ─────────────────────────────────────────────────

  private loadScores(): { timeMs: number; deaths: number }[] {
    try { return JSON.parse(localStorage.getItem('escape_dice_lab_scores') ?? '[]') } catch { return [] }
  }

  private formatMs(ms: number): string {
    const t = Math.floor(ms / 1000)
    return `${Math.floor(t / 60)}:${(t % 60).toString().padStart(2, '0')}`
  }
}
