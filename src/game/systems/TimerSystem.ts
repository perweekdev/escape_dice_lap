import { TIMER_LIMIT_MS, DEATH_PENALTY_MS } from '../../constants'

export default class TimerSystem {
  private elapsedMs = 0
  private limitMs = TIMER_LIMIT_MS
  private _deaths = 0

  get deaths() { return this._deaths }
  get elapsed() { return this.elapsedMs }
  get limit() { return this.limitMs }

  update(delta: number): 'ok' | 'gameover' {
    this.elapsedMs += delta
    if (this.elapsedMs >= this.limitMs) return 'gameover'
    return 'ok'
  }

  applyDeathPenalty(): 'ok' | 'gameover' {
    this._deaths++
    this.elapsedMs += DEATH_PENALTY_MS
    if (this.elapsedMs >= this.limitMs) return 'gameover'
    return 'ok'
  }

  formatElapsed(): string {
    return this.formatMs(this.elapsedMs)
  }

  formatRemaining(): string {
    const rem = Math.max(0, this.limitMs - this.elapsedMs)
    return this.formatMs(rem)
  }

  getRemainingMs(): number {
    return Math.max(0, this.limitMs - this.elapsedMs)
  }

  isWarning(): boolean {
    return this.getRemainingMs() < 3 * 60 * 1000
  }

  private formatMs(ms: number): string {
    const total = Math.floor(ms / 1000)
    const m = Math.floor(total / 60)
    const s = total % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  reset() {
    this.elapsedMs = 0
    this._deaths = 0
  }
}
